import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { StockMovementService, BulkMovementPayload } from '../../services/stock-movement.service';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { Product } from '../../models/product.model';
import { StockMovement } from '../../models/stock-movement.model';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';

interface BulkRowItem {
  product_id: number;
  type: 'in' | 'out';
  quantity: number;
}

interface BulkBatchGroup {
  reference_number: string;
  created_at: string;
  notes: string;
  total_items: number;
  total_quantity: number;
  movements: StockMovement[];
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TooltipModule
  ],
  template: `
    <!-- Main Inventory Container Card -->
    <div class="inventory-page-card">
      
      <!-- Top Header -->
      <div class="top-header">
        <div>
          <span class="operations-tag">OPERATIONS</span>
          <h1 class="page-heading">Inventory & Stock Audit</h1>
          <p class="page-subheading">Manage catalog items, monitor real-time stock updates, and inspect bulk invoice history.</p>
        </div>
        
        <button class="bell-btn" pTooltip="Notifications" tooltipPosition="bottom">
          <i class="pi pi-bell"></i>
        </button>
      </div>

      <!-- 4 KPI Stat Cards Grid -->
      <div class="grid-cols-4">
        <div class="stat-card card-border-green">
          <div>
            <span class="stat-title">TOTAL PRODUCTS</span>
            <h2 class="stat-count">{{ stats?.total_products || products.length }}</h2>
          </div>
          <div class="stat-icon-badge bg-green-light">
            <i class="pi pi-box"></i>
          </div>
        </div>

        <div class="stat-card card-border-emerald">
          <div>
            <span class="stat-title">IN STOCK</span>
            <h2 class="stat-count">{{ calculateInStockCount() }}</h2>
          </div>
          <div class="stat-icon-badge bg-emerald-light">
            <i class="pi pi-check-circle"></i>
          </div>
        </div>

        <div class="stat-card card-border-amber">
          <div>
            <span class="stat-title">LOW STOCK</span>
            <h2 class="stat-count">{{ calculateLowStockCount() }}</h2>
          </div>
          <div class="stat-icon-badge bg-amber-light">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
        </div>

        <div class="stat-card card-border-rose">
          <div>
            <span class="stat-title">OUT OF STOCK</span>
            <h2 class="stat-count">{{ calculateOutOfStockCount() }}</h2>
          </div>
          <div class="stat-icon-badge bg-rose-light">
            <i class="pi pi-times-circle"></i>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs Switcher -->
      <div class="nav-tabs-wrapper">
        <button 
          type="button" 
          class="nav-tab-btn" 
          [class.active]="activeTab === 'catalog'" 
          (click)="activeTab = 'catalog'">
          <i class="pi pi-box"></i>
          <span>Catalog Products</span>
          <span class="tab-badge">{{ products.length }}</span>
        </button>

        <button 
          type="button" 
          class="nav-tab-btn" 
          [class.active]="activeTab === 'updates'" 
          (click)="activeTab = 'updates'">
          <i class="pi pi-history"></i>
          <span>All Stock Updates History</span>
          <span class="tab-badge badge-green">{{ allMovements.length }}</span>
        </button>

        <button 
          type="button" 
          class="nav-tab-btn" 
          [class.active]="activeTab === 'bulk'" 
          (click)="activeTab = 'bulk'">
          <i class="pi pi-file"></i>
          <span>Bulk Movement / Invoice History</span>
          <span class="tab-badge badge-blue">{{ bulkBatches.length }}</span>
        </button>
      </div>

      <!-- TAB 1: CATALOG PRODUCTS -->
      <ng-container *ngIf="activeTab === 'catalog'">
        <!-- Toolbar Row with Custom Pristine Dropdown -->
        <div class="toolbar-bar">
          <div class="toolbar-left">
            <div class="search-wrapper">
              <i class="pi pi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (keyup)="applyFilters()" 
                placeholder="Search by name or model..." 
              />
            </div>

            <!-- CUSTOM PRISTINE STATUS FILTER DROPDOWN -->
            <div class="custom-dropdown-container">
              <button 
                type="button" 
                class="custom-dropdown-trigger" 
                [class.open]="isStatusDropdownOpen"
                (click)="toggleStatusDropdown($event)">
                <span>{{ getSelectedStatusLabel() }}</span>
                <i class="pi pi-chevron-down dropdown-arrow"></i>
              </button>

              <div class="custom-dropdown-menu" *ngIf="isStatusDropdownOpen">
                <div 
                  *ngFor="let opt of statusFilterOptions" 
                  class="custom-dropdown-item" 
                  [class.active]="selectedStatus === opt.value"
                  (click)="selectStatus(opt.value)">
                  {{ opt.label }}
                </div>
              </div>
            </div>
          </div>

          <div class="toolbar-right">
            <button class="icon-btn-toggle" (click)="loadAllData()" pTooltip="Refresh Inventory" tooltipPosition="bottom"><i class="pi pi-refresh"></i></button>

            <!-- Primary Add Product Button -->
            <button 
              pButton 
              label="Add Product" 
              icon="pi pi-plus"
              (click)="openAddProductModal()" 
              class="btn-add-green">
            </button>

            <button 
              pButton 
              label="Bulk Stock Movement" 
              icon="pi pi-plus-circle"
              (click)="openBulkMovementModal()" 
              class="btn-bulk-primary">
            </button>
          </div>
        </div>

        <!-- Products Datatable -->
        <div class="table-responsive-wrapper">
          <p-table 
            [value]="filteredProducts" 
            [paginator]="true" 
            [rows]="10" 
            [tableStyle]="{ 'min-width': '100%' }"
            styleClass="p-datatable-striped">
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="name">Product Name <p-sortIcon field="name"></p-sortIcon></th>
                <th pSortableColumn="sku">SKU Number <p-sortIcon field="sku"></p-sortIcon></th>
                <th pSortableColumn="quantity">Current Stock <p-sortIcon field="quantity"></p-sortIcon></th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-p>
              <tr>
                <td style="font-weight: 700; color: #0f172a; max-width: 350px;">
                  {{ p.name }}
                </td>
                <td>
                  <span class="sku-badge">{{ p.sku }}</span>
                </td>
                <td style="font-weight: 800; font-size: 0.9rem; color: #0f172a;">
                  {{ p.quantity }}
                </td>
                <td>
                  <span 
                    class="status-badge"
                    [ngClass]="{
                      'in-stock': p.quantity > (p.reorder_level || 5),
                      'low-stock': p.quantity > 0 && p.quantity <= (p.reorder_level || 5),
                      'out-of-stock': p.quantity <= 0
                    }">
                    <i [ngClass]="{
                      'pi pi-check-circle': p.quantity > (p.reorder_level || 5),
                      'pi pi-exclamation-triangle': p.quantity > 0 && p.quantity <= (p.reorder_level || 5),
                      'pi pi-times-circle': p.quantity <= 0
                    }"></i>
                    {{ p.quantity <= 0 ? 'Out of Stock' : (p.quantity <= (p.reorder_level || 5) ? 'Low Stock' : 'In Stock') }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button class="action-circle-btn" (click)="openSingleStockModal(p)" title="Update Stock">+</button>
                  <button class="action-circle-btn" (click)="openProductHistoryModal(p)" title="Product Stock History" style="color: #059669;">
                    <i class="pi pi-history" style="font-size: 0.725rem;"></i>
                  </button>
                  <button class="action-circle-btn" (click)="editProduct(p)" title="Edit Product">
                    <i class="pi pi-pencil" style="font-size: 0.7rem;"></i>
                  </button>
                  <button class="action-circle-btn" (click)="deleteProduct(p)" title="Delete Product" style="color: #dc2626;">
                    <i class="pi pi-trash" style="font-size: 0.7rem;"></i>
                  </button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" style="text-align: center; padding: 3rem 1rem; color: #64748b;">
                  <i class="pi pi-box" style="font-size: 2.25rem; color: #cbd5e1; margin-bottom: 0.75rem;"></i>
                  <div style="font-weight: 800; font-size: 1rem; margin-bottom: 0.35rem; color: #1e293b;">No Products Found</div>
                  <p style="font-size: 0.825rem; color: #64748b;">Click "Add Product" on the toolbar to add your first catalog item.</p>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </ng-container>

      <!-- TAB 2: ALL STOCK UPDATES HISTORY -->
      <ng-container *ngIf="activeTab === 'updates'">
        <div class="toolbar-bar" style="flex-wrap: wrap; gap: 0.75rem;">
          <div class="toolbar-left" style="flex-wrap: wrap; gap: 0.5rem;">
            <div class="search-wrapper" style="min-width: 220px;">
              <i class="pi pi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="historySearchQuery" 
                (keyup)="applyHistoryFilters()" 
                placeholder="Search history by Invoice No, product name, SKU..." 
              />
            </div>

            <!-- History Movement Type Dropdown -->
            <div class="custom-dropdown-container">
              <button 
                type="button" 
                class="custom-dropdown-trigger" 
                [class.open]="isHistoryTypeDropdownOpen"
                (click)="toggleHistoryTypeDropdown($event)">
                <span>{{ getSelectedHistoryTypeLabel() }}</span>
                <i class="pi pi-chevron-down dropdown-arrow"></i>
              </button>

              <div class="custom-dropdown-menu" *ngIf="isHistoryTypeDropdownOpen">
                <div 
                  *ngFor="let opt of historyTypeFilterOptions" 
                  class="custom-dropdown-item" 
                  [class.active]="historyTypeFilter === opt.value"
                  (click)="selectHistoryType(opt.value)">
                  {{ opt.label }}
                </div>
              </div>
            </div>

            <!-- Date Presets Filter Dropdown -->
            <div class="custom-dropdown-container">
              <button 
                type="button" 
                class="custom-dropdown-trigger" 
                [class.open]="isHistoryDateDropdownOpen"
                (click)="toggleHistoryDateDropdown($event)">
                <i class="pi pi-calendar" style="color: #059669; font-size: 0.8rem; margin-right: 0.2rem;"></i>
                <span>{{ getSelectedHistoryDateLabel() }}</span>
                <i class="pi pi-chevron-down dropdown-arrow"></i>
              </button>

              <div class="custom-dropdown-menu" *ngIf="isHistoryDateDropdownOpen" style="min-width: 150px;">
                <div 
                  *ngFor="let opt of historyDateFilterOptions" 
                  class="custom-dropdown-item" 
                  [class.active]="historyDateFilter === opt.value"
                  (click)="selectHistoryDate(opt.value)">
                  {{ opt.label }}
                </div>
              </div>
            </div>

            <!-- Custom Date Range Selector -->
            <div class="date-picker-group">
              <input 
                type="date" 
                [(ngModel)]="historyStartDate" 
                (change)="applyHistoryFilters()" 
                class="date-styled-input" 
                pTooltip="Start Date" 
                tooltipPosition="bottom"
              />
              <span style="color: #94a3b8; font-weight: 700; font-size: 0.75rem;">to</span>
              <input 
                type="date" 
                [(ngModel)]="historyEndDate" 
                (change)="applyHistoryFilters()" 
                class="date-styled-input" 
                pTooltip="End Date" 
                tooltipPosition="bottom"
              />
              <button 
                *ngIf="historyStartDate || historyEndDate" 
                type="button" 
                class="clear-date-btn" 
                (click)="clearCustomDates()" 
                pTooltip="Clear Date Filter" 
                tooltipPosition="bottom">
                <i class="pi pi-times-circle" style="font-size: 0.9rem;"></i>
              </button>
            </div>
          </div>

          <div class="toolbar-right">
            <button class="icon-btn-toggle" (click)="loadAllData()" pTooltip="Refresh History" tooltipPosition="bottom">
              <i class="pi pi-refresh"></i>
            </button>
            <button 
              pButton 
              label="Bulk Stock Movement" 
              icon="pi pi-plus-circle"
              (click)="openBulkMovementModal()" 
              class="btn-bulk-primary">
            </button>
          </div>
        </div>

        <!-- All Movements Datatable -->
        <div class="table-responsive-wrapper">
          <p-table 
            [value]="filteredMovements" 
            [paginator]="true" 
            [rows]="10" 
            [tableStyle]="{ 'min-width': '100%' }"
            styleClass="p-datatable-striped">
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="created_at">Date & Time <p-sortIcon field="created_at"></p-sortIcon></th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Invoice / Ref No.</th>
                <th>Notes</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-m>
              <tr>
                <td style="font-size: 0.775rem; color: #475569; white-space: nowrap;">
                  {{ m.created_at ? (m.created_at | date:'medium') : 'Recent' }}
                </td>
                <td style="font-weight: 700; color: #0f172a;">
                  {{ getProductName(m.product_id, m.product) }}
                </td>
                <td>
                  <span class="sku-badge">{{ getProductSku(m.product_id, m.product) }}</span>
                </td>
                <td>
                  <span 
                    class="movement-type-badge"
                    [ngClass]="{
                      'type-in': m.type === 'in',
                      'type-out': m.type === 'out',
                      'type-adjustment': m.type === 'adjustment'
                    }">
                    <i [ngClass]="{
                      'pi pi-arrow-down-left': m.type === 'in',
                      'pi pi-arrow-up-right': m.type === 'out',
                      'pi pi-sync': m.type === 'adjustment'
                    }"></i>
                    {{ m.type === 'in' ? 'STOCK IN' : (m.type === 'out' ? 'STOCK OUT' : 'ADJUSTMENT') }}
                  </span>
                </td>
                <td style="font-weight: 800; font-size: 0.9rem;" [style.color]="m.type === 'in' ? '#059669' : (m.type === 'out' ? '#dc2626' : '#d97706')">
                  {{ m.type === 'in' ? '+' : (m.type === 'out' ? '-' : '') }}{{ m.quantity }}
                </td>
                <td>
                  <span class="ref-code-badge bold-blue">
                    <i class="pi pi-file" style="font-size: 0.65rem; margin-right: 0.25rem;"></i>
                    {{ m.reference_number || 'N/A' }}
                  </span>
                </td>
                <td style="color: #64748b; font-size: 0.8rem;">
                  {{ m.notes || '-' }}
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: #64748b;">
                  <i class="pi pi-history" style="font-size: 2.25rem; color: #cbd5e1; margin-bottom: 0.75rem;"></i>
                  <div style="font-weight: 800; font-size: 1rem; margin-bottom: 0.35rem; color: #1e293b;">No Stock Update History</div>
                  <p style="font-size: 0.825rem; color: #64748b;">All stock additions, removals, and adjustments matching your filters will appear here.</p>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </ng-container>

      <!-- TAB 3: BULK MOVEMENT / INVOICE HISTORY -->
      <ng-container *ngIf="activeTab === 'bulk'">
        <div class="toolbar-bar" style="flex-wrap: wrap; gap: 0.75rem;">
          <div class="toolbar-left" style="flex-wrap: wrap; gap: 0.5rem;">
            <div class="search-wrapper" style="min-width: 240px;">
              <i class="pi pi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="historySearchQuery" 
                (keyup)="applyHistoryFilters()" 
                placeholder="Search bulk history by Invoice Number or notes..." 
              />
            </div>

            <!-- Quick Date Presets Dropdown -->
            <div class="custom-dropdown-container">
              <button 
                type="button" 
                class="custom-dropdown-trigger" 
                [class.open]="isHistoryDateDropdownOpen"
                (click)="toggleHistoryDateDropdown($event)">
                <i class="pi pi-calendar" style="color: #059669; font-size: 0.8rem; margin-right: 0.2rem;"></i>
                <span>{{ getSelectedHistoryDateLabel() }}</span>
                <i class="pi pi-chevron-down dropdown-arrow"></i>
              </button>

              <div class="custom-dropdown-menu" *ngIf="isHistoryDateDropdownOpen" style="min-width: 150px;">
                <div 
                  *ngFor="let opt of historyDateFilterOptions" 
                  class="custom-dropdown-item" 
                  [class.active]="historyDateFilter === opt.value"
                  (click)="selectHistoryDate(opt.value)">
                  {{ opt.label }}
                </div>
              </div>
            </div>

            <!-- Custom Date Range Selector -->
            <div class="date-picker-group">
              <input 
                type="date" 
                [(ngModel)]="historyStartDate" 
                (change)="applyHistoryFilters()" 
                class="date-styled-input" 
                pTooltip="Start Date" 
                tooltipPosition="bottom"
              />
              <span style="color: #94a3b8; font-weight: 700; font-size: 0.75rem;">to</span>
              <input 
                type="date" 
                [(ngModel)]="historyEndDate" 
                (change)="applyHistoryFilters()" 
                class="date-styled-input" 
                pTooltip="End Date" 
                tooltipPosition="bottom"
              />
              <button 
                *ngIf="historyStartDate || historyEndDate" 
                type="button" 
                class="clear-date-btn" 
                (click)="clearCustomDates()" 
                pTooltip="Clear Date Filter" 
                tooltipPosition="bottom">
                <i class="pi pi-times-circle" style="font-size: 0.9rem;"></i>
              </button>
            </div>
          </div>

          <div class="toolbar-right">
            <button class="icon-btn-toggle" (click)="loadAllData()" pTooltip="Refresh Batches" tooltipPosition="bottom">
              <i class="pi pi-refresh"></i>
            </button>
            <button 
              pButton 
              label="New Bulk Movement" 
              icon="pi pi-plus-circle"
              (click)="openBulkMovementModal()" 
              class="btn-bulk-primary">
            </button>
          </div>
        </div>

        <!-- Bulk Batches Datatable -->
        <div class="table-responsive-wrapper">
          <p-table 
            [value]="filteredBulkBatches" 
            [paginator]="true" 
            [rows]="10" 
            [tableStyle]="{ 'min-width': '100%' }"
            styleClass="p-datatable-striped">
            <ng-template pTemplate="header">
              <tr>
                <th>Invoice / Ref No.</th>
                <th>Date & Time</th>
                <th>Products Changed</th>
                <th>Total Units Moved</th>
                <th>Batch Notes</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-b>
              <tr>
                <td>
                  <span class="ref-code-badge bold-blue" style="font-size: 0.8rem; padding: 0.25rem 0.6rem;">
                    <i class="pi pi-file" style="margin-right: 0.3rem;"></i>
                    {{ b.reference_number }}
                  </span>
                </td>
                <td style="font-size: 0.775rem; color: #475569; white-space: nowrap;">
                  {{ b.created_at ? (b.created_at | date:'medium') : 'Recent' }}
                </td>
                <td style="font-weight: 700; color: #0f172a;">
                  <i class="pi pi-box" style="color: #2563eb; margin-right: 0.35rem;"></i>
                  {{ b.total_items }} {{ b.total_items === 1 ? 'Product' : 'Products' }}
                </td>
                <td style="font-weight: 800; color: #059669; font-size: 0.9rem;">
                  {{ b.total_quantity }} units
                </td>
                <td style="color: #64748b; font-size: 0.8rem;">
                  {{ b.notes || 'Bulk invoice movement' }}
                </td>
                <td style="text-align: right;">
                  <button 
                    type="button" 
                    class="btn-view-detail" 
                    (click)="openBatchDetailModal(b)">
                    <i class="pi pi-eye"></i> View Invoice Details
                  </button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6" style="text-align: center; padding: 3rem 1rem; color: #64748b;">
                  <i class="pi pi-file" style="font-size: 2.25rem; color: #cbd5e1; margin-bottom: 0.75rem;"></i>
                  <div style="font-weight: 800; font-size: 1rem; margin-bottom: 0.35rem; color: #1e293b;">No Bulk Invoices Found</div>
                  <p style="font-size: 0.825rem; color: #64748b;">Click "New Bulk Movement" to enter stock updates with an Invoice Number.</p>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </ng-container>

    </div>

    <!-- ADD / EDIT CATALOG PRODUCT MODAL -->
    <p-dialog 
      [(visible)]="isProductModalOpen" 
      [draggable]="false"
      [resizable]="false"
      [header]="currentProduct.id ? 'Edit Catalog Product' : 'Add New Catalog Product'" 
      [modal]="true" 
      [style]="{ width: '92vw', maxWidth: '600px' }">
      
      <form (ngSubmit)="saveProduct()" style="padding: 0.5rem 0.25rem;">
        <div class="form-grid-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Product Name *</label>
            <input 
              pInputText 
              type="text" 
              [(ngModel)]="currentProduct.name" 
              name="name" 
              required 
              placeholder="Enter Product Name (e.g. Smart Meter PRO)" 
              class="modal-styled-input" 
            />
          </div>

          <div class="form-group">
            <label class="form-label">SKU Number / Barcode *</label>
            <input 
              pInputText 
              type="text" 
              [(ngModel)]="currentProduct.sku" 
              name="sku" 
              required 
              placeholder="e.g. SKU-PRO-9942" 
              class="modal-styled-input" 
            />
          </div>
        </div>

        <div class="form-grid-2" style="margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Initial Quantity / Stock *</label>
            <p-inputNumber 
              [(ngModel)]="currentProduct.quantity" 
              name="quantity" 
              [min]="0" 
              placeholder="1">
            </p-inputNumber>
          </div>

          <div class="form-group">
            <label class="form-label">Reorder Minimum Level *</label>
            <p-inputNumber 
              [(ngModel)]="currentProduct.reorder_level" 
              name="reorder_level" 
              [min]="0" 
              placeholder="5">
            </p-inputNumber>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label">Product Description / Notes</label>
          <textarea 
            pInputText 
            [(ngModel)]="currentProduct.description" 
            name="description" 
            rows="3" 
            placeholder="Enter product specifications or inventory notes..." 
            class="modal-styled-textarea">
          </textarea>
        </div>

        <div class="dialog-action-row">
          <button type="button" class="btn-cancel-flat" (click)="closeProductModal()">
            <i class="pi pi-times"></i> Cancel
          </button>

          <button type="submit" class="btn-save-outline">
            <i class="pi pi-check"></i> {{ currentProduct.id ? 'Update Product' : 'Save Product' }}
          </button>
        </div>
      </form>
    </p-dialog>

    <!-- UPDATE SINGLE STOCK MODAL -->
    <p-dialog 
      [(visible)]="isSingleStockModalOpen" 
      [header]="'Update Stock — ' + (selectedProductForMovement?.name || '')" 
      [modal]="true" 
      [style]="{ width: '90vw', maxWidth: '480px' }">
      
      <form (ngSubmit)="saveSingleStockMovement()" style="padding: 0.5rem 0.25rem;" *ngIf="selectedProductForMovement">
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 0.5rem; padding: 0.85rem; margin-bottom: 1.15rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.7rem; font-weight: 700; color: #059669; text-transform: uppercase;">Current Inventory</div>
            <div style="font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-top: 0.1rem;">{{ selectedProductForMovement.name }}</div>
          </div>
          <div style="font-size: 1.25rem; font-weight: 900; color: #059669;">
            {{ selectedProductForMovement.quantity }} <span style="font-size: 0.75rem; font-weight: 600;">units</span>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Movement Type *</label>
          <div class="custom-dropdown-container" style="width: 100%;">
            <button 
              type="button" 
              class="custom-dropdown-trigger modal-dropdown-trigger" 
              [class.open]="isSingleTypeDropdownOpen"
              (click)="toggleSingleTypeDropdown($event)"
              style="width: 100%;">
              <span>{{ singleMovementType === 'in' ? 'Add Stock (+)' : 'Remove Stock (-)' }}</span>
              <i class="pi pi-chevron-down dropdown-arrow"></i>
            </button>

            <div class="custom-dropdown-menu" *ngIf="isSingleTypeDropdownOpen" style="width: 100%;">
              <div 
                *ngFor="let opt of simpleMovementTypeOptions" 
                class="custom-dropdown-item" 
                [class.active]="singleMovementType === opt.value"
                (click)="selectSingleType(opt.value)">
                {{ opt.label }}
              </div>
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Quantity *</label>
          <p-inputNumber 
            [(ngModel)]="singleQuantity" 
            name="singleQuantity" 
            [min]="1" 
            placeholder="1">
          </p-inputNumber>
        </div>

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label">Update Reason / Notes</label>
          <input 
            pInputText 
            type="text" 
            [(ngModel)]="singleMovementNotes" 
            name="singleMovementNotes" 
            placeholder="e.g. Stock shipment received / Audit adjustment" 
            class="modal-styled-input" 
          />
        </div>

        <div class="dialog-action-row">
          <button type="button" class="btn-cancel-flat" (click)="isSingleStockModalOpen = false">
            <i class="pi pi-times"></i> Cancel
          </button>

          <button type="submit" class="btn-save-outline">
            <i class="pi pi-check"></i> Apply Stock Update
          </button>
        </div>
      </form>
    </p-dialog>

    <!-- BULK STOCK MOVEMENT MODAL WITH INVOICE NUMBER -->
    <p-dialog 
      [(visible)]="isBulkModalOpen" 
      header="Bulk Stock Movement" 
      [modal]="true" 
      [style]="{ width: '94vw', maxWidth: '780px' }">
      
      <form (ngSubmit)="saveBulkMovement()" style="padding: 0.5rem 0.25rem;">
        
        <!-- Invoice Number & Notes Inputs -->
        <div class="form-grid-2" style="margin-bottom: 1.15rem;">
          <div class="form-group">
            <label class="form-label">Invoice Number / Bill No. *</label>
            <input 
              pInputText 
              type="text" 
              [(ngModel)]="bulkInvoiceNumber" 
              name="bulkInvoiceNumber" 
              required 
              placeholder="e.g. INV-2026-9041" 
              class="modal-styled-input" 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Batch Notes / Remarks (Optional)</label>
            <input 
              pInputText 
              type="text" 
              [(ngModel)]="bulkBatchNotes" 
              name="bulkBatchNotes" 
              placeholder="e.g. Supplier Shipment / Monthly Audit" 
              class="modal-styled-input" 
            />
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <span style="font-weight: 800; font-size: 0.825rem; color: #1e293b;">Product Movement Items</span>
          <button type="button" class="btn-add-row" (click)="addBulkRow()">
            <i class="pi pi-plus"></i> Add Product Row
          </button>
        </div>

        <div 
          *ngFor="let row of bulkRows; let idx = index" 
          class="bulk-row-item" 
          style="display: grid; grid-template-columns: 2fr 1.2fr 1fr auto; gap: 0.75rem; align-items: center; background: #f8fafc; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; margin-bottom: 0.75rem;">
          
          <!-- Product Dropdown -->
          <div class="form-group" style="margin: 0;">
            <div class="custom-dropdown-container" style="width: 100%;">
              <button 
                type="button" 
                class="custom-dropdown-trigger modal-dropdown-trigger" 
                [class.open]="activeBulkProdDropdownIdx === idx"
                (click)="toggleBulkProdDropdown(idx, $event)"
                style="width: 100%;">
                <span>{{ getBulkProdLabel(row.product_id) }}</span>
                <i class="pi pi-chevron-down dropdown-arrow"></i>
              </button>

              <div class="custom-dropdown-menu" *ngIf="activeBulkProdDropdownIdx === idx" style="width: 100%; max-height: 180px; overflow-y: auto;">
                <div 
                  *ngFor="let opt of productOptions" 
                  class="custom-dropdown-item" 
                  [class.active]="row.product_id === opt.value"
                  (click)="selectBulkProd(idx, opt.value)">
                  {{ opt.label }}
                </div>
              </div>
            </div>
          </div>

          <!-- Movement Type Dropdown -->
          <div class="form-group" style="margin: 0;">
            <div class="custom-dropdown-container" style="width: 100%;">
              <button 
                type="button" 
                class="custom-dropdown-trigger modal-dropdown-trigger" 
                [class.open]="activeBulkTypeDropdownIdx === idx"
                (click)="toggleBulkTypeDropdown(idx, $event)"
                style="width: 100%;">
                <span>{{ getBulkTypeLabel(row.type) }}</span>
                <i class="pi pi-chevron-down dropdown-arrow"></i>
              </button>

              <div class="custom-dropdown-menu" *ngIf="activeBulkTypeDropdownIdx === idx" style="width: 100%;">
                <div 
                  *ngFor="let opt of simpleMovementTypeOptions" 
                  class="custom-dropdown-item" 
                  [class.active]="row.type === opt.value"
                  (click)="selectBulkType(idx, opt.value)">
                  {{ opt.label }}
                </div>
              </div>
            </div>
          </div>

          <!-- Quantity Input -->
          <div class="form-group" style="margin: 0;">
            <p-inputNumber 
              [(ngModel)]="row.quantity" 
              [name]="'bulkQty_' + idx" 
              [min]="1" 
              placeholder="1">
            </p-inputNumber>
          </div>

          <!-- Delete Row Button -->
          <button 
            type="button" 
            pButton 
            icon="pi pi-trash" 
            (click)="removeBulkRow(idx)" 
            [disabled]="bulkRows.length <= 1"
            class="p-button-danger p-button-sm">
          </button>
        </div>

        <div class="dialog-action-row">
          <button type="button" class="btn-cancel-flat" (click)="isBulkModalOpen = false">
            <i class="pi pi-times"></i> Cancel
          </button>

          <button type="submit" class="btn-save-outline">
            <i class="pi pi-check"></i> Process Bulk Movement
          </button>
        </div>
      </form>
    </p-dialog>

    <!-- PRODUCT SPECIFIC STOCK HISTORY MODAL -->
    <p-dialog 
      [(visible)]="isProductHistoryModalOpen" 
      [header]="'Stock Movement History — ' + (selectedProductForHistory?.name || '')" 
      [modal]="true" 
      [style]="{ width: '92vw', maxWidth: '680px' }">
      
      <div style="padding: 0.5rem 0.25rem;" *ngIf="selectedProductForHistory">
        <!-- Product Header Banner -->
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 0.5rem; padding: 0.85rem; margin-bottom: 1.15rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.7rem; font-weight: 700; color: #059669; text-transform: uppercase;">SKU: {{ selectedProductForHistory.sku }}</div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #0f172a; margin-top: 0.1rem;">{{ selectedProductForHistory.name }}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.65rem; font-weight: 700; color: #059669;">CURRENT INVENTORY</div>
            <div style="font-size: 1.25rem; font-weight: 900; color: #0f172a;">{{ selectedProductForHistory.quantity }} units</div>
          </div>
        </div>

        <!-- Movements Table for Product -->
        <p-table 
          [value]="selectedProductMovements" 
          [paginator]="true" 
          [rows]="5" 
          styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Invoice / Ref No.</th>
              <th>Notes</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-m>
            <tr>
              <td style="font-size: 0.75rem; color: #475569;">
                {{ m.created_at ? (m.created_at | date:'medium') : 'Recent' }}
              </td>
              <td>
                <span 
                  class="movement-type-badge"
                  [ngClass]="{
                    'type-in': m.type === 'in',
                    'type-out': m.type === 'out',
                    'type-adjustment': m.type === 'adjustment'
                  }">
                  {{ m.type === 'in' ? '+ IN' : (m.type === 'out' ? '- OUT' : '= ADJ') }}
                </span>
              </td>
              <td style="font-weight: 800;" [style.color]="m.type === 'in' ? '#059669' : (m.type === 'out' ? '#dc2626' : '#d97706')">
                {{ m.type === 'in' ? '+' : (m.type === 'out' ? '-' : '') }}{{ m.quantity }}
              </td>
              <td>
                <span class="ref-code-badge bold-blue">
                  <i class="pi pi-file" style="font-size: 0.65rem; margin-right: 0.2rem;"></i>
                  {{ m.reference_number || 'N/A' }}
                </span>
              </td>
              <td style="font-size: 0.775rem; color: #64748b;">{{ m.notes || '-' }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" style="text-align: center; padding: 2rem 1rem; color: #64748b;">
                No stock movement transactions recorded for this product.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <div class="dialog-action-row" style="margin-top: 1.25rem;">
        <button type="button" class="btn-cancel-flat" (click)="isProductHistoryModalOpen = false">
          Close History
        </button>
      </div>
    </p-dialog>

    <!-- BULK BATCH DETAIL / INVOICE MODAL -->
    <p-dialog 
      [(visible)]="isBatchDetailModalOpen" 
      [header]="'Invoice Details — ' + (selectedBatch?.reference_number || '')" 
      [modal]="true" 
      [style]="{ width: '92vw', maxWidth: '680px' }">
      
      <div style="padding: 0.5rem 0.25rem;" *ngIf="selectedBatch">
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.5rem; padding: 0.85rem; margin-bottom: 1.15rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.7rem; font-weight: 700; color: #2563eb; text-transform: uppercase;">INVOICE NUMBER</div>
            <div style="font-size: 1.1rem; font-weight: 900; color: #1e3a8a; margin-top: 0.1rem; display: flex; align-items: center; gap: 0.4rem;">
              <i class="pi pi-file"></i> {{ selectedBatch.reference_number }}
            </div>
            <div style="font-size: 0.75rem; color: #475569; margin-top: 0.25rem;">{{ selectedBatch.notes }}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.65rem; font-weight: 700; color: #2563eb;">INVOICE SUMMARY</div>
            <div style="font-size: 1.1rem; font-weight: 900; color: #0f172a;">
              {{ selectedBatch.total_items }} Items ({{ selectedBatch.total_quantity }} Units)
            </div>
          </div>
        </div>

        <p-table [value]="selectedBatch.movements" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Type</th>
              <th>Quantity Moved</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-m>
            <tr>
              <td style="font-weight: 700; color: #0f172a;">{{ getProductName(m.product_id, m.product) }}</td>
              <td><span class="sku-badge">{{ getProductSku(m.product_id, m.product) }}</span></td>
              <td>
                <span 
                  class="movement-type-badge"
                  [ngClass]="{
                    'type-in': m.type === 'in',
                    'type-out': m.type === 'out',
                    'type-adjustment': m.type === 'adjustment'
                  }">
                  {{ m.type === 'in' ? '+ IN' : (m.type === 'out' ? '- OUT' : '= ADJ') }}
                </span>
              </td>
              <td style="font-weight: 800;" [style.color]="m.type === 'in' ? '#059669' : (m.type === 'out' ? '#dc2626' : '#d97706')">
                {{ m.type === 'in' ? '+' : (m.type === 'out' ? '-' : '') }}{{ m.quantity }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <div class="dialog-action-row" style="margin-top: 1.25rem;">
        <button type="button" class="btn-cancel-flat" (click)="isBatchDetailModalOpen = false">
          Close Invoice Details
        </button>
      </div>
    </p-dialog>
  `,
  styles: [`
    /* NAVIGATION TABS STYLES */
    .nav-tabs-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.5rem;
      overflow-x: auto;
    }
    .nav-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 0.9rem;
      border-radius: 0.45rem;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #64748b;
      font-size: 0.775rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .nav-tab-btn:hover {
      background: #ffffff;
      color: #0f172a;
      border-color: #cbd5e1;
    }
    .nav-tab-btn.active {
      background: #ffffff;
      color: #059669;
      border-color: #059669;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.12);
    }
    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.1rem 0.45rem;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 800;
      background: #e2e8f0;
      color: #334155;
    }
    .tab-badge.badge-green {
      background: #d1fae5;
      color: #047857;
    }
    .tab-badge.badge-blue {
      background: #dbeafe;
      color: #1d4ed8;
    }

    /* DATE PICKER GROUP */
    .date-picker-group {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .date-styled-input {
      padding: 0.425rem 0.55rem;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 0.4rem;
      color: #334155;
      font-size: 0.75rem;
      font-weight: 600;
      outline: none;
      font-family: inherit;
      transition: all 0.15s ease;
    }
    .date-styled-input:focus {
      border-color: #059669;
      box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.1);
    }
    .clear-date-btn {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      padding: 0.2rem;
      display: flex;
      align-items: center;
    }

    /* BADGES FOR MOVEMENTS */
    .movement-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.5rem;
      border-radius: 0.35rem;
      font-size: 0.675rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .movement-type-badge.type-in {
      background-color: #d1fae5;
      color: #047857;
    }
    .movement-type-badge.type-out {
      background-color: #ffe4e6;
      color: #be123c;
    }
    .movement-type-badge.type-adjustment {
      background-color: #fef3c7;
      color: #b45309;
    }
    .ref-code-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.15rem 0.45rem;
      border-radius: 0.25rem;
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #475569;
      font-family: monospace;
      font-size: 0.725rem;
      font-weight: 700;
    }
    .ref-code-badge.bold-blue {
      background-color: #eff6ff;
      border-color: #93c5fd;
      color: #1d4ed8;
    }
    .btn-view-detail {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      border-radius: 0.35rem;
      border: 1px solid #93c5fd;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.725rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-view-detail:hover {
      background: #dbeafe;
      border-color: #3b82f6;
    }

    /* CUSTOM PRISTINE DROPDOWN STYLES */
    .custom-dropdown-container {
      position: relative;
      display: inline-block;
    }
    .custom-dropdown-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.65rem;
      padding: 0.45rem 0.75rem;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 0.4rem;
      color: #334155;
      font-size: 0.775rem;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      transition: all 0.15s ease;
      min-width: 140px;
    }
    .custom-dropdown-trigger:hover, .custom-dropdown-trigger.open {
      border-color: #059669;
      box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.1);
    }
    .dropdown-arrow {
      font-size: 0.65rem;
      color: #64748b;
      transition: transform 0.15s ease;
    }
    .custom-dropdown-trigger.open .dropdown-arrow {
      transform: rotate(180deg);
    }
    .custom-dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 1000;
      min-width: 100%;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.4rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      padding: 0.25rem 0;
    }
    .custom-dropdown-item {
      padding: 0.45rem 0.75rem;
      font-size: 0.75rem;
      color: #334155;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.1s ease;
    }
    .custom-dropdown-item:hover {
      background-color: #f1f5f9;
      color: #0f172a;
    }
    .custom-dropdown-item.active {
      background-color: #ecfdf5;
      color: #059669;
      font-weight: 700;
    }

    .modal-dropdown-trigger {
      border-color: #cbd5e1;
      padding: 0.5rem 0.75rem;
    }

    .btn-add-row {
      background: none;
      border: 1px solid #059669;
      color: #059669;
      border-radius: 0.35rem;
      padding: 0.3rem 0.6rem;
      font-size: 0.725rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-add-row:hover {
      background: #ecfdf5;
    }
  `]
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  stats: DashboardStats | null = null;

  // Active Tab: 'catalog' | 'updates' | 'bulk'
  activeTab: 'catalog' | 'updates' | 'bulk' = 'catalog';

  // All Movement History & Bulk Batches State
  allMovements: StockMovement[] = [];
  filteredMovements: StockMovement[] = [];
  bulkBatches: BulkBatchGroup[] = [];
  filteredBulkBatches: BulkBatchGroup[] = [];

  historySearchQuery: string = '';
  historyTypeFilter: string = 'all';
  isHistoryTypeDropdownOpen: boolean = false;

  // Date Filtering State
  historyDateFilter: string = 'all';
  historyStartDate: string = '';
  historyEndDate: string = '';
  isHistoryDateDropdownOpen: boolean = false;

  historyDateFilterOptions = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'This Month', value: 'this_month' }
  ];

  historyTypeFilterOptions = [
    { label: 'All movement types', value: 'all' },
    { label: 'Stock IN (+)', value: 'in' },
    { label: 'Stock OUT (-)', value: 'out' },
    { label: 'Stock Adjustments (=)', value: 'adjustment' }
  ];

  searchQuery: string = '';
  selectedStatus: string = 'all';
  isStatusDropdownOpen: boolean = false;

  // Single Stock Movement State
  isSingleTypeDropdownOpen: boolean = false;
  isSingleStockModalOpen: boolean = false;
  selectedProductForMovement: Product | null = null;
  singleMovementType: 'in' | 'out' = 'in';
  singleQuantity: number = 1;
  singleMovementNotes: string = '';

  // Bulk Stock Movement State with Invoice Number
  isBulkModalOpen: boolean = false;
  bulkInvoiceNumber: string = '';
  bulkBatchNotes: string = '';
  bulkRows: BulkRowItem[] = [];

  // Custom Bulk Dropdown Open State Tracking
  activeBulkProdDropdownIdx: number | null = null;
  activeBulkTypeDropdownIdx: number | null = null;

  statusFilterOptions = [
    { label: 'All stock', value: 'all' },
    { label: 'In stock', value: 'in_stock' },
    { label: 'Low stock', value: 'low_stock' },
    { label: 'Out of stock', value: 'out_of_stock' }
  ];

  simpleMovementTypeOptions = [
    { label: 'Add Stock (+)', value: 'in' },
    { label: 'Remove Stock (-)', value: 'out' }
  ];

  productOptions: { label: string; value: number }[] = [];

  // Product Add/Edit State
  isProductModalOpen: boolean = false;
  currentProduct: Product = this.emptyProduct();

  // Individual Product History Modal State
  isProductHistoryModalOpen: boolean = false;
  selectedProductForHistory: Product | null = null;
  selectedProductMovements: StockMovement[] = [];

  // Bulk Batch Detail Modal State
  isBatchDetailModalOpen: boolean = false;
  selectedBatch: BulkBatchGroup | null = null;

  constructor(
    private productService: ProductService,
    private stockMovementService: StockMovementService,
    private dashboardService: DashboardService
  ) { }

  ngOnInit(): void {
    this.loadAllData();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-container')) {
      this.isStatusDropdownOpen = false;
      this.isSingleTypeDropdownOpen = false;
      this.isHistoryTypeDropdownOpen = false;
      this.isHistoryDateDropdownOpen = false;
      this.activeBulkProdDropdownIdx = null;
      this.activeBulkTypeDropdownIdx = null;
    }
  }

  loadAllData(): void {
    this.loadProducts();
    this.loadStats();
    this.loadMovements();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = this.deduplicateProducts(data || []);
        this.updateProductOptions();
        this.applyFilters();
      },
      error: () => {
        this.products = this.deduplicateProducts(this.productService.getLocalProducts());
        this.updateProductOptions();
        this.applyFilters();
      }
    });
  }

  deduplicateProducts(list: Product[]): Product[] {
    const map = new Map<string | number, Product>();
    list.forEach(p => {
      const key = p.id ? `id_${p.id}` : (p.sku ? `sku_${p.sku.toLowerCase()}` : `name_${p.name.toLowerCase()}`);
      if (!map.has(key)) {
        map.set(key, { ...p });
      } else {
        const existing = map.get(key)!;
        existing.quantity = p.quantity;
      }
    });
    return Array.from(map.values());
  }

  loadStats(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => this.stats = data,
      error: () => { }
    });
  }

  loadMovements(): void {
    this.stockMovementService.getMovements().subscribe({
      next: (data) => {
        this.allMovements = data || [];
        this.processBulkBatches();
        this.applyHistoryFilters();
      },
      error: () => {
        this.allMovements = [];
        this.processBulkBatches();
        this.applyHistoryFilters();
      }
    });
  }

  processBulkBatches(): void {
    const map = new Map<string, StockMovement[]>();

    this.allMovements.forEach(m => {
      const refKey = m.reference_number || `INV-${m.created_at ? m.created_at.substring(0, 10).replace(/-/g, '') : 'LEGACY'}`;
      if (!map.has(refKey)) {
        map.set(refKey, []);
      }
      map.get(refKey)!.push(m);
    });

    this.bulkBatches = Array.from(map.entries()).map(([ref, items]) => {
      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
      const latestDate = items[0]?.created_at || new Date().toISOString();
      const batchNotes = items.find(i => i.notes)?.notes || 'Bulk invoice movement';

      return {
        reference_number: ref,
        created_at: latestDate,
        notes: batchNotes,
        total_items: items.length,
        total_quantity: totalQty,
        movements: items
      };
    });
  }

  getProductName(productId: number, movementProduct?: Product): string {
    if (movementProduct?.name) return movementProduct.name;
    const prod = this.products.find(p => p.id === productId);
    return prod ? prod.name : `Product #${productId}`;
  }

  getProductSku(productId: number, movementProduct?: Product): string {
    if (movementProduct?.sku) return movementProduct.sku;
    const prod = this.products.find(p => p.id === productId);
    return prod ? prod.sku : `SKU-${productId}`;
  }

  calculateInStockCount(): number {
    return this.products.filter(p => p.quantity > (p.reorder_level || 5)).length;
  }

  calculateLowStockCount(): number {
    return this.products.filter(p => p.quantity > 0 && p.quantity <= (p.reorder_level || 5)).length;
  }

  calculateOutOfStockCount(): number {
    return this.products.filter(p => p.quantity <= 0).length;
  }

  updateProductOptions(): void {
    this.productOptions = this.products.map(p => ({
      label: `${p.name} (Current Stock: ${p.quantity})`,
      value: p.id!
    }));
  }

  applyFilters(): void {
    let result = [...this.products];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }

    if (this.selectedStatus === 'in_stock') {
      result = result.filter(p => p.quantity > (p.reorder_level || 5));
    } else if (this.selectedStatus === 'low_stock') {
      result = result.filter(p => p.quantity > 0 && p.quantity <= (p.reorder_level || 5));
    } else if (this.selectedStatus === 'out_of_stock') {
      result = result.filter(p => p.quantity <= 0);
    }

    this.filteredProducts = result;
  }

  isWithinDateRange(createdAtStr?: string): boolean {
    if (!createdAtStr) return true;
    const createdDate = new Date(createdAtStr);
    const now = new Date();

    if (this.historyStartDate) {
      const start = new Date(this.historyStartDate);
      start.setHours(0, 0, 0, 0);
      if (createdDate < start) return false;
    }

    if (this.historyEndDate) {
      const end = new Date(this.historyEndDate);
      end.setHours(23, 59, 59, 999);
      if (createdDate > end) return false;
    }

    if (this.historyDateFilter === 'all') return true;

    if (this.historyDateFilter === 'today') {
      return createdDate.toDateString() === now.toDateString();
    }

    if (this.historyDateFilter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return createdDate.toDateString() === yesterday.toDateString();
    }

    if (this.historyDateFilter === '7days') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return createdDate >= sevenDaysAgo;
    }

    if (this.historyDateFilter === '30days') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }

    if (this.historyDateFilter === 'this_month') {
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    }

    return true;
  }

  applyHistoryFilters(): void {
    // Filter Individual Movement Updates by Search, Movement Type, and Date Range
    let movementsResult = [...this.allMovements];

    if (this.historySearchQuery.trim()) {
      const q = this.historySearchQuery.toLowerCase().trim();
      movementsResult = movementsResult.filter(m => {
        const prodName = this.getProductName(m.product_id, m.product).toLowerCase();
        const prodSku = this.getProductSku(m.product_id, m.product).toLowerCase();
        const refCode = (m.reference_number || '').toLowerCase();
        const notes = (m.notes || '').toLowerCase();
        return prodName.includes(q) || prodSku.includes(q) || refCode.includes(q) || notes.includes(q);
      });
    }

    if (this.historyTypeFilter !== 'all') {
      movementsResult = movementsResult.filter(m => m.type === this.historyTypeFilter);
    }

    movementsResult = movementsResult.filter(m => this.isWithinDateRange(m.created_at));
    this.filteredMovements = movementsResult;

    // Filter Bulk Batches by Search and Date Range
    let batchesResult = [...this.bulkBatches];
    if (this.historySearchQuery.trim()) {
      const q = this.historySearchQuery.toLowerCase().trim();
      batchesResult = batchesResult.filter(b =>
        b.reference_number.toLowerCase().includes(q) ||
        b.notes.toLowerCase().includes(q)
      );
    }

    batchesResult = batchesResult.filter(b => this.isWithinDateRange(b.created_at));
    this.filteredBulkBatches = batchesResult;
  }

  toggleStatusDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.activeBulkProdDropdownIdx = null;
    this.activeBulkTypeDropdownIdx = null;
    this.isSingleTypeDropdownOpen = false;
    this.isHistoryTypeDropdownOpen = false;
    this.isHistoryDateDropdownOpen = false;
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
  }

  selectStatus(val: string): void {
    this.selectedStatus = val;
    this.isStatusDropdownOpen = false;
    this.applyFilters();
  }

  getSelectedStatusLabel(): string {
    const found = this.statusFilterOptions.find(o => o.value === this.selectedStatus);
    return found ? found.label : 'All stock';
  }

  toggleHistoryTypeDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isHistoryDateDropdownOpen = false;
    this.isHistoryTypeDropdownOpen = !this.isHistoryTypeDropdownOpen;
  }

  selectHistoryType(val: string): void {
    this.historyTypeFilter = val;
    this.isHistoryTypeDropdownOpen = false;
    this.applyHistoryFilters();
  }

  getSelectedHistoryTypeLabel(): string {
    const found = this.historyTypeFilterOptions.find(o => o.value === this.historyTypeFilter);
    return found ? found.label : 'All movement types';
  }

  toggleHistoryDateDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isHistoryTypeDropdownOpen = false;
    this.isHistoryDateDropdownOpen = !this.isHistoryDateDropdownOpen;
  }

  selectHistoryDate(val: string): void {
    this.historyDateFilter = val;
    this.isHistoryDateDropdownOpen = false;
    this.applyHistoryFilters();
  }

  getSelectedHistoryDateLabel(): string {
    const found = this.historyDateFilterOptions.find(o => o.value === this.historyDateFilter);
    return found ? found.label : 'All Time';
  }

  clearCustomDates(): void {
    this.historyStartDate = '';
    this.historyEndDate = '';
    this.applyHistoryFilters();
  }

  toggleSingleTypeDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isSingleTypeDropdownOpen = !this.isSingleTypeDropdownOpen;
  }

  selectSingleType(typeVal: string): void {
    this.singleMovementType = typeVal as 'in' | 'out';
    this.isSingleTypeDropdownOpen = false;
  }

  toggleBulkProdDropdown(idx: number, event: MouseEvent): void {
    event.stopPropagation();
    this.isStatusDropdownOpen = false;
    this.isSingleTypeDropdownOpen = false;
    this.isHistoryTypeDropdownOpen = false;
    this.isHistoryDateDropdownOpen = false;
    this.activeBulkTypeDropdownIdx = null;
    this.activeBulkProdDropdownIdx = this.activeBulkProdDropdownIdx === idx ? null : idx;
  }

  toggleBulkTypeDropdown(idx: number, event: MouseEvent): void {
    event.stopPropagation();
    this.isStatusDropdownOpen = false;
    this.isSingleTypeDropdownOpen = false;
    this.isHistoryTypeDropdownOpen = false;
    this.isHistoryDateDropdownOpen = false;
    this.activeBulkProdDropdownIdx = null;
    this.activeBulkTypeDropdownIdx = this.activeBulkTypeDropdownIdx === idx ? null : idx;
  }

  selectBulkProd(idx: number, prodId: number): void {
    this.bulkRows[idx].product_id = prodId;
    this.activeBulkProdDropdownIdx = null;
  }

  selectBulkType(idx: number, typeVal: string): void {
    this.bulkRows[idx].type = typeVal as 'in' | 'out';
    this.activeBulkTypeDropdownIdx = null;
  }

  getBulkProdLabel(prodId: number): string {
    const found = this.productOptions.find(o => o.value === prodId);
    return found ? found.label : 'Select Product';
  }

  getBulkTypeLabel(typeVal: 'in' | 'out'): string {
    return typeVal === 'in' ? 'Add Stock (+)' : 'Remove Stock (-)';
  }

  emptyProduct(): Product {
    const randomSku = 'SKU-' + Math.floor(1000 + Math.random() * 9000);
    return {
      sku: randomSku,
      name: '',
      description: '',
      quantity: 1,
      reorder_level: 5,
      cost_price: 0.00,
      unit_price: 0.00
    };
  }

  openAddProductModal(): void {
    this.currentProduct = this.emptyProduct();
    this.isProductModalOpen = true;
  }

  editProduct(p: Product): void {
    this.currentProduct = { ...p };
    this.isProductModalOpen = true;
  }

  closeProductModal(): void {
    this.isProductModalOpen = false;
  }

  saveProduct(): void {
    if (!this.currentProduct.name || !this.currentProduct.sku) {
      alert('Please fill in Product Name and SKU Number.');
      return;
    }

    if (this.currentProduct.id) {
      this.productService.updateProduct(this.currentProduct.id, this.currentProduct).subscribe({
        next: () => {
          this.loadAllData();
          this.closeProductModal();
        },
        error: (err) => {
          alert('Error updating product: ' + (err.error?.message || 'Check fields'));
        }
      });
    } else {
      this.productService.createProduct(this.currentProduct).subscribe({
        next: () => {
          this.loadAllData();
          this.closeProductModal();
        },
        error: (err) => {
          alert('Error creating product: ' + (err.error?.message || 'Check fields'));
        }
      });
    }
  }

  deleteProduct(p: Product): void {
    if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
      this.productService.deleteProduct(p.id!).subscribe(() => {
        this.loadAllData();
      });
    }
  }

  // --- 1. Single Stock Movement ---
  openSingleStockModal(p: Product): void {
    this.selectedProductForMovement = p;
    this.singleMovementType = 'in';
    this.singleQuantity = 1;
    this.singleMovementNotes = '';
    this.isSingleTypeDropdownOpen = false;
    this.isSingleStockModalOpen = true;
  }

  saveSingleStockMovement(): void {
    if (!this.selectedProductForMovement) return;

    const targetId = this.selectedProductForMovement.id!;
    const type = this.singleMovementType;
    const qty = this.singleQuantity;

    // Update in-memory quantity directly
    const existing = this.products.find(p => p.id === targetId || (p.sku && p.sku === this.selectedProductForMovement?.sku));
    if (existing) {
      if (type === 'in') {
        existing.quantity += qty;
      } else if (type === 'out') {
        existing.quantity = Math.max(0, existing.quantity - qty);
      }
    }
    this.productService.updateLocalStock(targetId, type, qty);

    const refCode = `ADJ-${Math.floor(100000 + Math.random() * 900000)}`;
    const payload: BulkMovementPayload = {
      reference_number: refCode,
      notes: this.singleMovementNotes || `Stock update for ${this.selectedProductForMovement.name}`,
      items: [{
        product_id: targetId,
        type: type,
        quantity: qty
      }]
    };

    this.stockMovementService.createBulkMovements(payload).subscribe({
      next: () => {
        this.loadAllData();
        this.isSingleStockModalOpen = false;
      },
      error: () => {
        this.loadAllData();
        this.isSingleStockModalOpen = false;
      }
    });
  }

  // --- 2. Bulk Stock Movement with Invoice Number ---
  openBulkMovementModal(): void {
    const year = new Date().getFullYear();
    const randNum = Math.floor(1000 + Math.random() * 9000);
    this.bulkInvoiceNumber = `INV-${year}-${randNum}`;
    this.bulkBatchNotes = '';
    this.bulkRows = [];

    if (this.products.length > 0) {
      this.bulkRows.push({
        product_id: this.products[0].id!,
        type: 'in',
        quantity: 1
      });
    }

    this.isBulkModalOpen = true;
  }

  addBulkRow(): void {
    const defaultProdId = this.products.length > 0 ? this.products[0].id! : 1;
    this.bulkRows.push({
      product_id: defaultProdId,
      type: 'in',
      quantity: 1
    });
  }

  removeBulkRow(index: number): void {
    if (this.bulkRows.length > 1) {
      this.bulkRows.splice(index, 1);
    }
  }

  saveBulkMovement(): void {
    if (this.bulkRows.length === 0) {
      alert('Please add at least one product row.');
      return;
    }

    this.bulkRows.forEach(row => {
      const existing = this.products.find(p => p.id === row.product_id);
      if (existing) {
        if (row.type === 'in') {
          existing.quantity += row.quantity;
        } else if (row.type === 'out') {
          existing.quantity = Math.max(0, existing.quantity - row.quantity);
        }
      }
      this.productService.updateLocalStock(row.product_id, row.type, row.quantity);
    });

    const invoiceNo = this.bulkInvoiceNumber.trim() || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload: BulkMovementPayload = {
      reference_number: invoiceNo,
      notes: this.bulkBatchNotes || 'Bulk invoice movement',
      items: this.bulkRows
    };

    this.stockMovementService.createBulkMovements(payload).subscribe({
      next: () => {
        this.loadAllData();
        this.isBulkModalOpen = false;
      },
      error: () => {
        this.loadAllData();
        this.isBulkModalOpen = false;
      }
    });
  }

  // --- 3. Individual Product History Modal ---
  openProductHistoryModal(p: Product): void {
    this.selectedProductForHistory = p;
    this.selectedProductMovements = this.allMovements.filter(m => m.product_id === p.id);
    this.isProductHistoryModalOpen = true;
  }

  // --- 4. Bulk Batch Detail Modal ---
  openBatchDetailModal(batch: BulkBatchGroup): void {
    this.selectedBatch = batch;
    this.isBatchDetailModalOpen = true;
  }
}
