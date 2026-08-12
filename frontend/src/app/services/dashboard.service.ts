import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { StockMovement } from '../models/stock-movement.model';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  total_products: number;
  in_stock_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_categories: number;
  total_suppliers: number;
  total_stock_value: number;
  recent_movements: StockMovement[];
  low_stock_products: Product[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard/stats`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.apiUrl).pipe(
      catchError(() => {
        return of({
          total_products: 0,
          in_stock_count: 0,
          low_stock_count: 0,
          out_of_stock_count: 0,
          total_categories: 0,
          total_suppliers: 0,
          total_stock_value: 0,
          recent_movements: [],
          low_stock_products: []
        });
      })
    );
  }
}
