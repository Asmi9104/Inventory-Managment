import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, TableModule, TagModule, ButtonModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard Overview</h1>
        <p class="page-subtitle">Real-time inventory metrics, low stock alerts, and stock activities powered by PrimeNG.</p>
      </div>
      <button pButton label="Add New Product" icon="pi pi-plus" routerLink="/products" class="p-button-primary"></button>
    </div>

    <!-- PrimeNG Stat Cards Grid -->
    <div class="grid grid-cols-4" style="margin-bottom: 2rem;">
      <p-card>
        <div class="stat-card">
          <div class="stat-icon bg-indigo">
            <i class="pi pi-box" style="font-size: 1.5rem;"></i>
          </div>
          <div>
            <span class="stat-label">Total Products</span>
            <h2 class="stat-value">{{ stats?.total_products || 0 }}</h2>
          </div>
        </div>
      </p-card>

      <p-card>
        <div class="stat-card">
          <div class="stat-icon bg-emerald">
            <i class="pi pi-dollar" style="font-size: 1.5rem;"></i>
          </div>
          <div>
            <span class="stat-label">Total Stock Value</span>
            <h2 class="stat-value">\${{ (stats?.total_stock_value || 0) | number:'1.2-2' }}</h2>
          </div>
        </div>
      </p-card>

      <p-card>
        <div class="stat-card">
          <div class="stat-icon bg-amber">
            <i class="pi pi-exclamation-triangle" style="font-size: 1.5rem;"></i>
          </div>
          <div>
            <span class="stat-label">Low Stock Alerts</span>
            <h2 class="stat-value text-amber">{{ stats?.low_stock_count || 0 }}</h2>
          </div>
        </div>
      </p-card>

      <p-card>
        <div class="stat-card">
          <div class="stat-icon bg-purple">
            <i class="pi pi-tags" style="font-size: 1.5rem;"></i>
          </div>
          <div>
            <span class="stat-label">Categories</span>
            <h2 class="stat-value">{{ stats?.total_categories || 0 }}</h2>
          </div>
        </div>
      </p-card>
    </div>

    <!-- Data Tables Grid using PrimeNG p-table -->
    <div class="grid grid-cols-2">
      <!-- Low Stock Warning Card -->
      <p-card header="Low Stock Warning">
        <p-table [value]="stats?.low_stock_products || []" [tableStyle]="{ 'min-width': '100%' }" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>In Stock</th>
              <th>Reorder Min</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td style="font-weight: 600;">{{ item.name }}</td>
              <td><p-tag [value]="item.sku" severity="info"></p-tag></td>
              <td><p-tag [value]="item.quantity + ' units'" severity="danger"></p-tag></td>
              <td>{{ item.reorder_level }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                All products are sufficiently stocked!
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Recent Stock Movements Card -->
      <p-card header="Recent Stock Movements">
        <p-table [value]="stats?.recent_movements || []" [tableStyle]="{ 'min-width': '100%' }" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Reference</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-m>
            <tr>
              <td style="font-weight: 600;">{{ m.product?.name || 'Item #' + m.product_id }}</td>
              <td>
                <p-tag 
                  [value]="m.type | uppercase" 
                  [severity]="m.type === 'in' ? 'success' : m.type === 'out' ? 'danger' : 'warn'">
                </p-tag>
              </td>
              <td>{{ m.quantity }}</td>
              <td><p-tag [value]="m.reference_number || 'N/A'" severity="secondary"></p-tag></td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                No recent stock activity logged.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `,
  styles: [`
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .bg-indigo { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    .bg-emerald { background: linear-gradient(135deg, #10b981, #059669); }
    .bg-amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .bg-purple { background: linear-gradient(135deg, #a855f7, #9333ea); }
    .stat-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    .stat-value { font-size: 1.6rem; font-weight: 800; margin-top: 0.15rem; }
    .text-amber { color: var(--warning); }
  `]
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => this.stats = data,
      error: (err) => console.error('Failed to load dashboard stats', err)
    });
  }
}
