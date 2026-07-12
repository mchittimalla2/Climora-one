<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
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

    public function store(Request $request)
    {
        $validated = $this->validateProduct($request, true);

        $product = Product::create([
            'name' => $validated['name'],
            'category' => $validated['category'] ?? null,
            'price' => $validated['price'],
            'stock' => $validated['stock'] ?? 0,
            'description' => $validated['description'] ?? null,
        ]);

        $imagePaths = $this->storeSlotImages($request, $product);

        $product->update([
            'main_image' => $imagePaths[0] ?? null,
            'images' => $imagePaths,
        ]);

        return response()->json([
            'message' => 'Product created successfully',
            'product' => $this->serializeProduct($product->fresh()),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $validated = $this->validateProduct($request, false);
        $existingImages = array_pad($product->images ?: array_filter([$product->main_image]), 4, null);
        $imagePaths = $this->storeSlotImages($request, $product, $existingImages);

        $product->update([
            'name' => $validated['name'],
            'category' => $validated['category'] ?? null,
            'price' => $validated['price'],
            'stock' => $validated['stock'] ?? 0,
            'description' => $validated['description'] ?? null,
            'main_image' => $imagePaths[0] ?? null,
            'images' => $imagePaths,
        ]);

        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $this->serializeProduct($product->fresh()),
        ]);
    }

    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        Storage::disk('public')->deleteDirectory("products/{$product->id}");
        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully',
        ]);
    }

    private function validateProduct(Request $request, bool $imagesRequired): array
    {
        $imageRule = [$imagesRequired ? 'required' : 'nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'];

        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'category' => ['nullable', 'string', 'max:100'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'image_main' => $imageRule,
            'image_side' => $imageRule,
            'image_top' => $imageRule,
            'image_back' => $imageRule,
        ]);
    }

    private function storeSlotImages(Request $request, Product $product, array $existingImages = []): array
    {
        $paths = array_pad($existingImages, 4, null);

        foreach (self::IMAGE_SLOTS as $index => $slot) {
            $field = "image_{$slot}";

            if (!$request->hasFile($field)) {
                continue;
            }

            if (!empty($paths[$index])) {
                Storage::disk('public')->delete($paths[$index]);
            }

            $image = $request->file($field);
            $extension = strtolower($image->getClientOriginalExtension());
            $paths[$index] = $image->storeAs(
                "products/{$product->id}",
                "{$slot}.{$extension}",
                'public'
            );
        }

        return array_values($paths);
    }

    private function serializeProduct(Product $product): array
    {
        $paths = array_values(array_filter($product->images ?: array_filter([$product->main_image])));
        $urls = array_map(
            fn ($path) => Storage::disk('public')->url($path),
            $paths
        );

        return [
            'id' => $product->id,
            'name' => $product->name,
            'category' => $product->category,
            'price' => $product->price,
            'stock' => $product->stock,
            'description' => $product->description,
            'main_image' => $urls[0] ?? null,
            'images' => $urls,
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
        ];
    }
}
