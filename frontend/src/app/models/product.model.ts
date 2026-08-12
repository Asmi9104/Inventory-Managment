export interface Product {
  id?: number;
  sku: string;
  name: string;
  description?: string;
  category_id?: number;
  supplier_id?: number;
  quantity: number;
  reorder_level: number;
  cost_price: number;
  unit_price: number;
  created_at?: string;
  updated_at?: string;
}
