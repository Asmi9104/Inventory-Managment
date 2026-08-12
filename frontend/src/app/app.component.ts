import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="app-container">
      <!-- Mobile Overlay Backburner -->
      <div 
        class="mobile-backdrop" 
        *ngIf="isMobileSidebarOpen" 
        (click)="isMobileSidebarOpen = false">
      </div>

      <!-- Left Sidebar (Logos, Inventory Only, Admin Profile) -->
      <app-sidebar 
        [isOpen]="isMobileSidebarOpen" 
        (close)="isMobileSidebarOpen = false">
      </app-sidebar>

      <!-- Main Content Container -->
      <div class="main-content">
        <!-- Mobile Top Navbar Bar -->
        <header class="mobile-nav-bar">
          <button class="hamburger-btn" (click)="isMobileSidebarOpen = !isMobileSidebarOpen">
            <i class="pi pi-bars"></i>
          </button>

          <div class="mobile-brand-title">
            <span style="font-weight: 800; color: #059669;">Inventory</span> OS
          </div>

          <div class="mobile-avatar">GU</div>
        </header>

        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .mobile-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 90;
    }
    .mobile-nav-bar {
      display: none;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.25rem;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 80;
    }
    .hamburger-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #0f172a;
      cursor: pointer;
      padding: 0.25rem;
    }
    .mobile-brand-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
    }
    .mobile-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #fde68a;
      color: #92400e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 800;
    }

    @media (max-width: 900px) {
      .mobile-nav-bar {
        display: flex;
      }
    }
  `]
})
export class AppComponent {
  title = 'Inventory OS';
  isMobileSidebarOpen: boolean = false;
}
