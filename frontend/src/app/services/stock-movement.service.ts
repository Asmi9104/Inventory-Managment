import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StockMovement } from '../models/stock-movement.model';
import { environment } from '../../environments/environment';

export interface BulkMovementPayload {
  reference_number?: string;
  notes?: string;
  items: {
    product_id: number;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class StockMovementService {
  private apiUrl = `${environment.apiUrl}/stock-movements`;
  private localMovements: StockMovement[] = [];

  constructor(private http: HttpClient) {}

  getMovements(): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(this.apiUrl).pipe(
      catchError(() => of(this.localMovements))
    );
  }

  createMovement(movement: StockMovement): Observable<StockMovement> {
    return this.http.post<StockMovement>(this.apiUrl, movement).pipe(
      catchError(() => {
        const created: StockMovement = {
          ...movement,
          id: Date.now(),
          created_at: new Date().toISOString()
        };
        this.localMovements.unshift(created);
        return of(created);
      })
    );
  }

  createBulkMovements(payload: BulkMovementPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk`, payload).pipe(
      catchError(() => {
        const now = new Date().toISOString();
        const createdList: StockMovement[] = payload.items.map((item, idx) => ({
          id: Date.now() + idx,
          product_id: item.product_id,
          type: item.type,
          quantity: item.quantity,
          reference_number: payload.reference_number || 'BULK-MOVE',
          notes: payload.notes || 'Bulk movement',
          created_at: now
        }));
        this.localMovements.unshift(...createdList);
        return of({ message: 'Processed offline', movements: createdList });
      })
    );
  }
}
