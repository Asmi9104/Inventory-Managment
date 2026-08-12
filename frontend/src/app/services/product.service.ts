import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  
  // Memory fallback storage if backend API server is offline
  private localProducts: Product[] = [];

  constructor(private http: HttpClient) {}

  getProducts(filters?: { search?: string; category_id?: number; low_stock?: boolean }): Observable<Product[]> {
    let params = new HttpParams();
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.category_id) {
      params = params.set('category_id', filters.category_id.toString());
    }
    if (filters?.low_stock) {
      params = params.set('low_stock', 'true');
    }

    return this.http.get<Product[]>(this.apiUrl, { params }).pipe(
      catchError(() => {
        console.warn(`Backend API at ${environment.apiUrl} is offline. Using memory fallback.`);
        return of(this.localProducts);
      })
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        const found = this.localProducts.find(p => p.id === id) || this.localProducts[0];
        return of(found);
      })
    );
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product).pipe(
      catchError(() => {
        const created: Product = {
          ...product,
          id: Date.now()
        };
        this.localProducts.unshift(created);
        return of(created);
      })
    );
  }

  updateProduct(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product).pipe(
      catchError(() => {
        const idx = this.localProducts.findIndex(p => p.id === id);
        if (idx !== -1) {
          this.localProducts[idx] = { ...product, id };
        }
        return of(product);
      })
    );
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        this.localProducts = this.localProducts.filter(p => p.id !== id);
        return of({ message: 'Deleted locally' });
      })
    );
  }

  getLocalProducts(): Product[] {
    return this.localProducts;
  }

  updateLocalStock(productId: number, type: 'in' | 'out' | 'adjustment', qty: number): void {
    const prod = this.localProducts.find(p => p.id === productId);
    if (prod) {
      if (type === 'in') {
        prod.quantity += qty;
      } else if (type === 'out') {
        prod.quantity = Math.max(0, prod.quantity - qty);
      } else if (type === 'adjustment') {
        prod.quantity = qty;
      }
    }
  }
}
