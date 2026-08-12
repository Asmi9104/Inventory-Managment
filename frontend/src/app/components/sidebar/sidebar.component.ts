import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed" [class.mobile-open]="isOpen">
      <div class="sidebar-top">
        <!-- Header -->
        <div class="brand-header" *ngIf="isOpen">
          <button class="mobile-close-btn" (click)="closeSidebar()">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="menu-section-title" *ngIf="!isCollapsed">OPERATIONS</div>

        <!-- Sidebar Menu Items: STRICTLY ONLY INVENTORY -->
        <nav class="nav-menu">
          <button class="nav-item active" pTooltip="Inventory" tooltipPosition="right">
            <i class="pi pi-th-large"></i>
            <span *ngIf="!isCollapsed">Inventory</span>
          </button>
        </nav>
      </div>

      <!-- Bottom Profile & Collapse Toggle Button -->
      <div class="sidebar-bottom">
        <!-- Collapse / Expand Toggle Button -->
        <button class="collapse-toggle-btn" (click)="toggleCollapse()" [pTooltip]="isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'" tooltipPosition="right">
          <i class="pi" [ngClass]="isCollapsed ? 'pi-angle-right' : 'pi-angle-left'"></i>
        </button>

        <div class="role-section" *ngIf="!isCollapsed">
          <span class="role-title">ACTIVE ROLE</span>
          <div class="role-badge">
            <i class="pi pi-heart" style="font-size: 0.6rem; color: #059669;"></i>
            <span>Super Admin</span>
          </div>
        </div>

        <div class="user-profile-row" pTooltip="Super Admin" tooltipPosition="right">
          <div class="user-avatar-circle">
            <span>GU</span>
          </div>
          <div class="user-meta" *ngIf="!isCollapsed">
            <span class="user-name">Super Admin</span>
            <span class="user-sub">46 permissions</span>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 215px;
      background-color: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1rem 0.75rem;
      min-height: 100vh;
      position: sticky;
      top: 0;
      z-index: 100;
      transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sidebar.collapsed {
      width: 60px;
      padding: 1rem 0.4rem;
      align-items: center;
    }
    .sidebar-top {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .brand-header {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
      padding-left: 0.2rem;
    }
    .sidebar.collapsed .brand-header {
      justify-content: center;
      padding-left: 0;
    }
    .mobile-close-btn {
      display: none;
      margin-left: auto;
      background: none;
      border: none;
      color: #64748b;
      font-size: 0.95rem;
      cursor: pointer;
    }
    .menu-section-title {
      font-size: 0.6rem;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.08em;
      margin-bottom: 0.5rem;
      padding-left: 0.4rem;
    }
    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      width: 100%;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.55rem 0.7rem;
      border-radius: 0.4rem;
      color: #475569;
      background: transparent;
      border: none;
      font-size: 0.775rem;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
      text-align: left;
      transition: all 0.15s ease;
    }
    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 0.55rem 0;
      width: 38px;
      height: 38px;
      margin: 0 auto;
    }
    .nav-item i {
      font-size: 1rem;
      color: #64748b;
    }
    .nav-item:hover {
      background-color: #f8fafc;
      color: #0f172a;
    }
    .nav-item.active {
      background-color: #059669;
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 3px 8px rgba(5, 150, 105, 0.25);
    }
    .nav-item.active i {
      color: #ffffff;
    }
    .sidebar-bottom {
      border-top: 1px solid #f1f5f9;
      padding-top: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      width: 100%;
    }
    .collapse-toggle-btn {
      width: 100%;
      height: 30px;
      border-radius: 0.35rem;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .collapse-toggle-btn:hover {
      background: #f8fafc;
      color: #0f172a;
      border-color: #cbd5e1;
    }
    .role-section {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding-left: 0.2rem;
    }
    .role-title {
      font-size: 0.575rem;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.04em;
    }
    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: #059669;
    }
    .user-profile-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3rem;
      border-radius: 0.4rem;
      background-color: #f8fafc;
      border: 1px solid #f1f5f9;
    }
    .sidebar.collapsed .user-profile-row {
      justify-content: center;
      background: transparent;
      border: none;
      padding: 0;
    }
    .user-avatar-circle {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #fde68a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.725rem;
      font-weight: 800;
      color: #92400e;
    }
    .user-meta {
      display: flex;
      flex-direction: column;
      flex: 1;
      line-height: 1.1;
    }
    .user-name {
      font-size: 0.725rem;
      font-weight: 700;
      color: #0f172a;
    }
    .user-sub {
      font-size: 0.625rem;
      color: #64748b;
    }

    @media (max-width: 900px) {
      .sidebar {
        position: fixed;
        left: -260px;
        top: 0;
        bottom: 0;
        height: 100vh;
      }
      .sidebar.mobile-open {
        left: 0;
        width: 215px !important;
      }
      .mobile-close-btn {
        display: block;
      }
    }
  `]
})
export class SidebarComponent {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  isCollapsed: boolean = true; // Closed icon bar mode by default

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  closeSidebar(): void {
    this.close.emit();
  }
}
