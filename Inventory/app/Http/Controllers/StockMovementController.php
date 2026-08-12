<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockMovementController extends Controller
{
    public function index()
    {
        $movements = StockMovement::with('product')->latest()->get();
        return response()->json($movements);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:in,out,adjustment',
            'quantity' => 'required|integer|min:1',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $movement = DB::transaction(function () use ($validated) {
            $product = Product::findOrFail($validated['product_id']);

            if ($validated['type'] === 'in') {
                $product->quantity += $validated['quantity'];
            } elseif ($validated['type'] === 'out') {
                if ($product->quantity < $validated['quantity']) {
                    throw ValidationException::withMessages([
                        'quantity' => ["Insufficient stock for product '{$product->name}'. Current stock: {$product->quantity}"]
                    ]);
                }
                $product->quantity -= $validated['quantity'];
            } elseif ($validated['type'] === 'adjustment') {
                $product->quantity = $validated['quantity'];
            }

            $product->save();

            return StockMovement::create($validated);
        });

        return response()->json($movement->load('product'), 201);
    }

    public function storeBulk(Request $request)
    {
        $validated = $request->validate([
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.type' => 'required|in:in,out,adjustment',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $createdMovements = DB::transaction(function () use ($validated) {
            $movements = [];

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                if ($item['type'] === 'in') {
                    $product->quantity += $item['quantity'];
                } elseif ($item['type'] === 'out') {
                    if ($product->quantity < $item['quantity']) {
                        throw ValidationException::withMessages([
                            'quantity' => ["Insufficient stock for '{$product->name}'. Current stock: {$product->quantity}"]
                        ]);
                    }
                    $product->quantity -= $item['quantity'];
                } elseif ($item['type'] === 'adjustment') {
                    $product->quantity = $item['quantity'];
                }

                $product->save();

                $movements[] = StockMovement::create([
                    'product_id' => $item['product_id'],
                    'type' => $item['type'],
                    'quantity' => $item['quantity'],
                    'reference_number' => $validated['reference_number'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]);
            }

            return $movements;
        });

        return response()->json([
            'message' => 'Bulk stock movements processed successfully',
            'movements' => $createdMovements
        ], 201);
    }
}
