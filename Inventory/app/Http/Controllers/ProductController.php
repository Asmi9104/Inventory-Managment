<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of products filtered by search and stock status.
     */
    public function index(Request $request)
    {
        $query = Product::query();

        // 1. Search Query (Name or SKU)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // 2. Stock Status Filter
        if ($request->filled('status')) {
            if ($request->status === 'in_stock') {
                $query->whereColumn('quantity', '>', 'reorder_level');
            } elseif ($request->status === 'low_stock') {
                $query->where('quantity', '>', 0)
                      ->whereColumn('quantity', '<=', 'reorder_level');
            } elseif ($request->status === 'out_of_stock') {
                $query->where('quantity', '<=', 0);
            }
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sku' => 'required|string|unique:products,sku',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'required|integer|min:0',
            'reorder_level' => 'nullable|integer|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'category_id' => 'nullable|integer',
            'supplier_id' => 'nullable|integer',
        ]);

        if (empty($validated['reorder_level'])) {
            $validated['reorder_level'] = 5;
        }
        if (empty($validated['cost_price'])) {
            $validated['cost_price'] = 0.00;
        }

        // Ensure category exists to satisfy MySQL foreign key constraint 1452
        if (!empty($validated['category_id'])) {
            $catExists = Category::where('id', $validated['category_id'])->exists();
            if (!$catExists) {
                $category = Category::firstOrCreate(['name' => 'General']);
                $validated['category_id'] = $category->id;
            }
        } else {
            $category = Category::firstOrCreate(['name' => 'General']);
            $validated['category_id'] = $category->id;
        }

        $product = Product::create($validated);

        return response()->json($product, 201);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product)
    {
        return response()->json($product->load('stockMovements'));
    }

    /**
     * Update the specified product in storage.
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'sku' => 'required|string|unique:products,sku,' . $product->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'quantity' => 'required|integer|min:0',
            'reorder_level' => 'nullable|integer|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'category_id' => 'nullable|integer',
            'supplier_id' => 'nullable|integer',
        ]);

        if (!empty($validated['category_id'])) {
            $catExists = Category::where('id', $validated['category_id'])->exists();
            if (!$catExists) {
                $category = Category::firstOrCreate(['name' => 'General']);
                $validated['category_id'] = $category->id;
            }
        } else {
            $category = Category::firstOrCreate(['name' => 'General']);
            $validated['category_id'] = $category->id;
        }

        $product->update($validated);

        return response()->json($product);
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(['message' => 'Product deleted successfully']);
    }
}
