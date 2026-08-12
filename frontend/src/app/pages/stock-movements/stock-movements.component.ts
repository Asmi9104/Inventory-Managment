import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockMovementService } from '../../services/stock-movement.service';
import { ProductService } from '../../services/product.service';
import { StockMovement } from '../../models/stock-movement.model';
import { Product } from '../../models/product.model';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-stock-movements',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableModule, 
    DialogModule, 
    ButtonModule, 
    InputTextModule, 
    InputNumberModule,
    DropdownModule, 
    TagModule
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Stock Audit & Movement Logs</h1>
        <p class="page-subtitle">Record stock receiving, customer dispatches, and inventory adjustments using PrimeNG.</p>
      </div>
      <button pButton label="Log Stock Transaction" icon="pi pi-plus" (click)="openModal()" class="p-button-primary"></button>
    </div>

    <!-- PrimeNG Datatable -->
    <p-table 
      [value]="movements" 
      [paginator]="true" 
      [rows]="10" 
      [tableStyle]="{ 'min-width': '100%' }"
      styleClass="p-datatable-striped">
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="created_at">Date & Time <p-sortIcon field="created_at"></p-sortIcon></th>
          <th>Product</th>
          <th>Movement Type</th>
          <th>Quantity</th>
          <th>Reference Code</th>
          <th>Notes</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-m>
        <tr>
          <td>{{ m.created_at | date:'medium' }}</td>
          <td style="font-weight: 600;">{{ m.product?.name || 'Product #' + m.product_id }}</td>
          <td>
            <p-tag 
              [value]="m.type | uppercase" 
              [severity]="m.type === 'in' ? 'success' : m.type === 'out' ? 'danger' : 'warn'">
            </p-tag>
          </td>
          <td style="font-weight: 700;">
            {{ m.type === 'in' ? '+' : m.type === 'out' ? '-' : '' }}{{ m.quantity }}
          </td>
          <td><p-tag [value]="m.reference_number || 'N/A'" severity="secondary"></p-tag></td>
          <td style="color: var(--text-muted);">{{ m.notes || '-' }}</td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No stock transactions recorded.
          </td>
        </tr>
      </ng-template>
    </p-table>

    <!-- PrimeNG Modal Dialog -->
    <p-dialog 
      [(visible)]="isModalOpen" 
      header="Record Stock Movement" 
      [modal]="true" 
      [style]="{ width: '550px' }">
      <form (ngSubmit)="saveMovement()">
        <div class="form-group">
          <label class="form-label">Select Product *</label>
          <p-dropdown 
            [options]="productOptions" 
            [(ngModel)]="currentMovement.product_id" 
            name="product_id" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Select Product">
          </p-dropdown>
        </div>

        <div class="grid grid-cols-2" style="gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Movement Type *</label>
            <p-dropdown 
              [options]="typeOptions" 
              [(ngModel)]="currentMovement.type" 
              name="type" 
              optionLabel="label" 
              optionValue="value">
            </p-dropdown>
          </div>

          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <p-inputNumber [(ngModel)]="currentMovement.quantity" name="quantity" [min]="1"></p-inputNumber>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Reference Number / PO / Invoice #</label>
          <input pInputText type="text" [(ngModel)]="currentMovement.reference_number" name="reference_number" placeholder="e.g. PO-2026-99" />
        </div>

        <div class="form-group">
          <label class="form-label">Notes / Remarks</label>
          <textarea pInputText [(ngModel)]="currentMovement.notes" name="notes" rows="3" placeholder="Reason for adjustment or transaction context..."></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" pButton label="Cancel" (click)="closeModal()" class="p-button-secondary"></button>
          <button type="submit" pButton label="Submit Transaction" icon="pi pi-check" class="p-button-primary"></button>
        </div>
      </form>
    </p-dialog>
  `
})
export class StockMovementsComponent implements OnInit {
  movements: StockMovement[] = [];
  products: Product[] = [];
  
  productOptions: { label: string; value: number }[] = [];
  typeOptions = [
    { label: 'STOCK IN (Purchase/Received)', value: 'in' },
    { label: 'STOCK OUT (Sales/Dispatch)', value: 'out' },
    { label: 'ADJUSTMENT (Audit correction)', value: 'adjustment' }
  ];

  isModalOpen: boolean = false;
  currentMovement: StockMovement = this.emptyMovement();

  constructor(
    private stockMovementService: StockMovementService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadMovements();
    this.productService.getProducts().subscribe(data => {
      this.products = data;
      this.productOptions = data.map(p => ({
        label: `${p.name} (SKU: ${p.sku} | Stock: ${p.quantity})`,
        value: p.id!
      }));
    });
  }

  loadMovements(): void {
    this.stockMovementService.getMovements().subscribe(data => this.movements = data);
  }

  emptyMovement(): StockMovement {
    return {
      product_id: 1,
      type: 'in',
      quantity: 1,
      reference_number: '',
      notes: ''
    };
  }

  openModal(): void {
    this.currentMovement = this.emptyMovement();
    if (this.products.length > 0) {
      this.currentMovement.product_id = this.products[0].id!;
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveMovement(): void {
    this.stockMovementService.createMovement(this.currentMovement).subscribe({
      next: () => {
        this.loadMovements();
        this.closeModal();
      },
      error: (err) => {
        const msg = err.error?.errors?.quantity?.[0] || err.error?.message || 'Error processing transaction';
        alert(msg);
      }
    });
  }
}
