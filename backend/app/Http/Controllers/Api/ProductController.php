<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json(
            Product::latest()->get()->map(fn (Product $product) => $this->serializeProduct($product))
        );
    }

    public function store(Request $request)
    {
        $validated = $this->validateProduct($request, true);
        $imagePaths = $this->storeImages($request);

        $product = Product::create([
            'name' => $validated['name'],
            'category' => $validated['category'] ?? null,
            'price' => $validated['price'],
            'stock' => $validated['stock'] ?? 0,
            'description' => $validated['description'] ?? null,
            'main_image' => $imagePaths[0] ?? null,
            'images' => $imagePaths,
        ]);

        return response()->json([
            'message' => 'Product created successfully',
            'product' => $this->serializeProduct($product),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $validated = $this->validateProduct($request, false);
        $newImagePaths = $this->storeImages($request);
        $imagePaths = $product->images ?: array_filter([$product->main_image]);

        if (count($newImagePaths) > 0) {
            $this->deleteImages($imagePaths);
            $imagePaths = $newImagePaths;
        }

        $product->update([
            'name' => $validated['name'],
            'category' => $validated['category'] ?? null,
            'price' => $validated['price'],
            'stock' => $validated['stock'] ?? 0,
            'description' => $validated['description'] ?? null,
            'main_image' => $imagePaths[0] ?? null,
            'images' => array_values($imagePaths),
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

        $this->deleteImages($product->images ?: array_filter([$product->main_image]));
        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully',
        ]);
    }

    private function validateProduct(Request $request, bool $imagesRequired): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'category' => ['nullable', 'string', 'max:100'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'images' => [$imagesRequired ? 'required' : 'nullable', 'array', 'max:4'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
        ]);
    }

    private function storeImages(Request $request): array
    {
        $paths = [];

        foreach ($request->file('images', []) as $image) {
            $filename = Str::uuid() . '.' . strtolower($image->getClientOriginalExtension());
            $paths[] = $image->storeAs('products', $filename, 'public');
        }

        return $paths;
    }

    private function deleteImages(array $paths): void
    {
        foreach ($paths as $path) {
            if ($path) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    private function serializeProduct(Product $product): array
    {
        $paths = $product->images ?: array_filter([$product->main_image]);
        $urls = array_map(
            fn ($path) => Storage::disk('public')->url($path),
            array_values($paths)
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
