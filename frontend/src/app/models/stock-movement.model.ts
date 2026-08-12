import { Product } from './product.model';

export interface StockMovement {
  id?: number;
  product_id: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_number?: string;
  notes?: string;
  product?: Product;
  created_at?: string;
  updated_at?: string;
}
