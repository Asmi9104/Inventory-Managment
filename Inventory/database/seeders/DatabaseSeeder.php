<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Supplier;
use App\Models\Product;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed default categories
        $categories = [
            ['name' => 'General Supplies', 'description' => 'General office and warehouse inventory'],
            ['name' => 'Solar Equipment', 'description' => 'Solar panels, inverters, and accessories'],
            ['name' => 'Electronics', 'description' => 'Electrical items and components'],
            ['name' => 'Hardware & Tools', 'description' => 'Tools, mounting gear, and hardware'],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(['name' => $cat['name']], $cat);
        }

        // Seed default companies / suppliers
        $suppliers = [
            ['name' => 'SOLUTIONS4SOLAR', 'contact_name' => 'Solar Operations', 'email' => 'contact@solutions4solar.com', 'phone' => '1300 000 111'],
            ['name' => 'Green Upgrades', 'contact_name' => 'Green Energy Dept', 'email' => 'support@greenupgrades.com', 'phone' => '1300 222 333'],
        ];

        foreach ($suppliers as $sup) {
            Supplier::firstOrCreate(['name' => $sup['name']], $sup);
        }

        // Database is clean without hardcoded sample products.
        // Users can add their own products dynamically via the UI!
    }
}
