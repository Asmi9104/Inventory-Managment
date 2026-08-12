import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../services/supplier.service';
import { Supplier } from '../../models/supplier.model';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableModule, 
    DialogModule, 
    ButtonModule, 
    InputTextModule, 
    TagModule
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Supplier Directory</h1>
        <p class="page-subtitle">Manage vendor contact info, emails, phone numbers, and addresses.</p>
      </div>
      <button pButton label="Add Supplier" icon="pi pi-plus" (click)="openModal()" class="p-button-primary"></button>
    </div>

    <!-- PrimeNG Datatable -->
    <p-table 
      [value]="suppliers" 
      [paginator]="true" 
      [rows]="10" 
      [tableStyle]="{ 'min-width': '100%' }"
      styleClass="p-datatable-striped">
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="name">Company Name <p-sortIcon field="name"></p-sortIcon></th>
          <th>Contact Person</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Address</th>
          <th>Supplied Items</th>
          <th style="text-align: right;">Actions</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-s>
        <tr>
          <td style="font-weight: 600;">{{ s.name }}</td>
          <td>{{ s.contact_person || 'N/A' }}</td>
          <td>{{ s.email || 'N/A' }}</td>
          <td>{{ s.phone || 'N/A' }}</td>
          <td style="color: var(--text-muted);">{{ s.address || 'N/A' }}</td>
          <td><p-tag [value]="(s.products_count || 0) + ' Items'" severity="info"></p-tag></td>
          <td style="text-align: right;">
            <button pButton icon="pi pi-pencil" (click)="editSupplier(s)" class="p-button-secondary p-button-sm mr-2"></button>
            <button pButton icon="pi pi-trash" (click)="deleteSupplier(s)" class="p-button-danger p-button-sm"></button>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No suppliers added yet.
          </td>
        </tr>
      </ng-template>
    </p-table>

    <!-- PrimeNG Modal Dialog -->
    <p-dialog 
      [(visible)]="isModalOpen" 
      [header]="currentSupplier.id ? 'Edit Supplier' : 'New Supplier'" 
      [modal]="true" 
      [style]="{ width: '550px' }">
      <form (ngSubmit)="saveSupplier()">
        <div class="grid grid-cols-2" style="gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Company Name *</label>
            <input pInputText type="text" [(ngModel)]="currentSupplier.name" name="name" required placeholder="e.g. Apex Tech" />
          </div>

          <div class="form-group">
            <label class="form-label">Contact Person</label>
            <input pInputText type="text" [(ngModel)]="currentSupplier.contact_person" name="contact_person" placeholder="Full Name" />
          </div>
        </div>

        <div class="grid grid-cols-2" style="gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input pInputText type="email" [(ngModel)]="currentSupplier.email" name="email" placeholder="vendor@domain.com" />
          </div>

          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input pInputText type="text" [(ngModel)]="currentSupplier.phone" name="phone" placeholder="+1 800-000-0000" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Address</label>
          <textarea pInputText [(ngModel)]="currentSupplier.address" name="address" rows="2" placeholder="Full street address"></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" pButton label="Cancel" (click)="closeModal()" class="p-button-secondary"></button>
          <button type="submit" pButton label="Save Supplier" icon="pi pi-check" class="p-button-primary"></button>
        </div>
      </form>
    </p-dialog>
  `
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  isModalOpen: boolean = false;
  currentSupplier: Supplier = { name: '' };

  constructor(private supplierService: SupplierService) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe(data => this.suppliers = data);
  }

  openModal(): void {
    this.currentSupplier = { name: '' };
    this.isModalOpen = true;
  }

  editSupplier(s: Supplier): void {
    this.currentSupplier = { ...s };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveSupplier(): void {
    if (this.currentSupplier.id) {
      this.supplierService.updateSupplier(this.currentSupplier.id, this.currentSupplier).subscribe(() => {
        this.loadSuppliers();
        this.closeModal();
      });
    } else {
      this.supplierService.createSupplier(this.currentSupplier).subscribe(() => {
        this.loadSuppliers();
        this.closeModal();
      });
    }
  }

  deleteSupplier(s: Supplier): void {
    if (confirm(`Delete supplier "${s.name}"?`)) {
      this.supplierService.deleteSupplier(s.id!).subscribe(() => this.loadSuppliers());
    }
  }
}
