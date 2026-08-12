import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header-container">
      <div class="header-titles">
        <span class="category-tag">OPERATIONS</span>
        <h1 class="main-title">Inventory</h1>
        <p class="subtitle">Stock levels and movements across companies.</p>
      </div>

      <div class="header-actions">
        <div class="notification-btn" title="Notifications">
          <i class="pi pi-bell"></i>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header-container {
      padding: 1.5rem 2rem 1rem 2rem;
      background-color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .category-tag {
      font-size: 0.725rem;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .main-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin-top: 0.15rem;
    }
    .subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.15rem;
    }
    .notification-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background-color: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      cursor: pointer;
      border: 1px solid #e2e8f0;
    }
  `]
})
export class NavbarComponent {}
