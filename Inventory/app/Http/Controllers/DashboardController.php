<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalProducts = Product::count();
        $inStockCount = Product::where('quantity', '>', 0)->count();
        $lowStockCount = Product::whereRaw('quantity > 0 AND quantity <= reorder_level')->count();
        $outOfStockCount = Product::where('quantity', '<=', 0)->count();
        $totalCategories = Category::count();
        $totalSuppliers = Supplier::count();
        
        $totalStockValue = Product::selectRaw('SUM(quantity * unit_price) as total_value')->value('total_value') ?? 0;
        
        $recentMovements = StockMovement::with('product')
            ->latest()
            ->take(5)
            ->get();

        $lowStockProducts = Product::with(['category', 'supplier'])
            ->whereRaw('quantity <= reorder_level')
            ->take(5)
            ->get();

        return response()->json([
            'total_products' => $totalProducts,
            'in_stock_count' => $inStockCount,
            'low_stock_count' => $lowStockCount,
            'out_of_stock_count' => $outOfStockCount,
            'total_categories' => $totalCategories,
            'total_suppliers' => $totalSuppliers,
            'total_stock_value' => (float)$totalStockValue,
            'recent_movements' => $recentMovements,
            'low_stock_products' => $lowStockProducts,
        ]);
    }
}
