<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    private const IMAGE_SLOTS = ['main', 'side', 'top', 'back'];

    public function index()
    {
        return response()->json(
            Product::latest()->get()->map(fn (Product $product) => $this->serializeProduct($product))
        );
    }

    public function recycleBin(Request $request)
    {
        if (!$request->user()?->isOwner() && !$request->user()?->isBreakGlass()) {
            return response()->json(['message' => 'Recycle Bin access is restricted to owners and break-glass users.'], 403);
        }

        return response()->json(
            Product::onlyTrashed()->with('deletedBy:id,name,email')->latest('deleted_at')->get()
                ->map(fn (Product $product) => $this->serializeProduct($product))
        );
    }

    public function store(Request $request)
    {
        $validated = $this->validateProduct($request, true);
        $product = Product::create([
            'name' => $validated['name'], 'category' => $validated['category'] ?? null,
            'price' => $validated['price'], 'stock' => $validated['stock'] ?? 0,
            'description' => $validated['description'] ?? null,
        ]);
        $imagePaths = $this->storeSlotImages($request, $product);
        $product->update(['main_image' => $imagePaths[0] ?? null, 'images' => $imagePaths]);

        return response()->json(['message' => 'Product created successfully', 'product' => $this->serializeProduct($product->fresh())], 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) return response()->json(['message' => 'Product not found'], 404);

        $validated = $this->validateProduct($request, false);
        $existingImages = array_pad($product->images ?: array_filter([$product->main_image]), 4, null);
        $imagePaths = $this->storeSlotImages($request, $product, $existingImages);
        $product->update([
            'name' => $validated['name'], 'category' => $validated['category'] ?? null,
            'price' => $validated['price'], 'stock' => $validated['stock'] ?? 0,
            'description' => $validated['description'] ?? null,
            'main_image' => $imagePaths[0] ?? null, 'images' => $imagePaths,
        ]);

        return response()->json(['message' => 'Product updated successfully', 'product' => $this->serializeProduct($product->fresh())]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user?->isOwner() && !$user?->isBreakGlass()) {
            return response()->json(['message' => 'Only an owner can move products to the Recycle Bin.'], 403);
        }

        $product = Product::find($id);
        if (!$product) return response()->json(['message' => 'Product not found'], 404);

        $product->forceFill([
            'deleted_by' => $user->id,
            'purge_eligible_at' => now()->addDays(30),
        ])->save();
        $product->delete();

        return response()->json(['message' => 'Product moved to the Recycle Bin for 30 days.']);
    }

    public function restore(Request $request, $id)
    {
        if (!$request->user()?->isOwner() && !$request->user()?->isBreakGlass()) {
            return response()->json(['message' => 'Only owners can restore deleted products.'], 403);
        }

        $product = Product::onlyTrashed()->find($id);
        if (!$product) return response()->json(['message' => 'Deleted product not found'], 404);

        $product->restore();
        $product->forceFill(['deleted_by' => null, 'purge_eligible_at' => null])->save();

        return response()->json(['message' => 'Product restored successfully.', 'product' => $this->serializeProduct($product->fresh())]);
    }

    public function forceDestroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user?->isBreakGlass()) {
            return response()->json(['message' => 'Permanent deletion is restricted to the break-glass account.'], 403);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'confirmation' => ['required', 'string'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'The current password is incorrect.'], 422);
        }

        $product = Product::onlyTrashed()->find($id);
        if (!$product) return response()->json(['message' => 'Deleted product not found'], 404);

        $expected = 'DELETE PRODUCT-' . $product->id;
        if ($validated['confirmation'] !== $expected) {
            return response()->json(['message' => "Type {$expected} exactly to permanently delete this product."], 422);
        }

        Storage::disk('public')->deleteDirectory("products/{$product->id}");
        $name = $product->name;
        $product->forceDelete();
        $this->sendPermanentDeletionAlert($user, $name, $id);

        return response()->json(['message' => 'Product permanently deleted. The owner has been notified.']);
    }

    private function sendPermanentDeletionAlert($actor, string $productName, $productId): void
    {
        $owners = \App\Models\User::where('role', \App\Models\User::ROLE_OWNER)->where('is_active', true)->pluck('email')->filter()->values();
        if ($owners->isEmpty()) return;

        try {
            Http::withHeaders(['api-key' => config('services.brevo.api_key'), 'accept' => 'application/json', 'content-type' => 'application/json'])
                ->timeout(15)->post('https://api.brevo.com/v3/smtp/email', [
                    'sender' => ['email' => config('services.brevo.from_email'), 'name' => config('services.brevo.from_name')],
                    'to' => $owners->map(fn ($email) => ['email' => $email])->all(),
                    'subject' => 'Security alert: product permanently deleted',
                    'textContent' => "Break-glass user {$actor->email} permanently deleted product {$productName} (ID {$productId}) at " . now()->toDateTimeString() . '.',
                ]);
        } catch (\Throwable $exception) {
            report($exception);
        }
    }

    private function validateProduct(Request $request, bool $imagesRequired): array
    {
        $imageRule = [$imagesRequired ? 'required' : 'nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'];
        return $request->validate([
            'name' => ['required', 'string', 'max:150'], 'category' => ['nullable', 'string', 'max:100'],
            'price' => ['required', 'numeric', 'min:0'], 'stock' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'image_main' => $imageRule, 'image_side' => $imageRule, 'image_top' => $imageRule, 'image_back' => $imageRule,
        ]);
    }

    private function storeSlotImages(Request $request, Product $product, array $existingImages = []): array
    {
        $paths = array_pad($existingImages, 4, null);
        foreach (self::IMAGE_SLOTS as $index => $slot) {
            $field = "image_{$slot}";
            if (!$request->hasFile($field)) continue;
            if (!empty($paths[$index])) Storage::disk('public')->delete($paths[$index]);
            $image = $request->file($field);
            $paths[$index] = $image->storeAs("products/{$product->id}", "{$slot}." . strtolower($image->getClientOriginalExtension()), 'public');
        }
        return array_values($paths);
    }

    private function serializeProduct(Product $product): array
    {
        $paths = array_values(array_filter($product->images ?: array_filter([$product->main_image])));
        $urls = array_map(fn ($path) => Storage::disk('public')->url($path), $paths);
        return [
            'id' => $product->id, 'name' => $product->name, 'category' => $product->category,
            'price' => $product->price, 'stock' => $product->stock, 'description' => $product->description,
            'main_image' => $urls[0] ?? null, 'images' => $urls,
            'deleted_at' => $product->deleted_at, 'purge_eligible_at' => $product->purge_eligible_at,
            'deleted_by' => $product->deletedBy ? ['name' => $product->deletedBy->name, 'email' => $product->deletedBy->email] : null,
            'created_at' => $product->created_at, 'updated_at' => $product->updated_at,
        ];
    }
}
