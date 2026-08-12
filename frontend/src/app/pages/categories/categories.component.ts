import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-categories',
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
        <h1 class="page-title">Category Management</h1>
        <p class="page-subtitle">Organize inventory catalog into distinct operational categories.</p>
      </div>
      <button pButton label="Add Category" icon="pi pi-plus" (click)="openModal()" class="p-button-primary"></button>
    </div>

    <!-- PrimeNG Datatable -->
    <p-table 
      [value]="categories" 
      [paginator]="true" 
      [rows]="10" 
      [tableStyle]="{ 'min-width': '100%' }"
      styleClass="p-datatable-striped">
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="id">ID <p-sortIcon field="id"></p-sortIcon></th>
          <th pSortableColumn="name">Category Name <p-sortIcon field="name"></p-sortIcon></th>
          <th>Description</th>
          <th>Product Count</th>
          <th style="text-align: right;">Actions</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-c>
        <tr>
          <td>#{{ c.id }}</td>
          <td style="font-weight: 600;">{{ c.name }}</td>
          <td style="color: var(--text-muted);">{{ c.description || 'No description' }}</td>
          <td><p-tag [value]="(c.products_count || 0) + ' Products'" severity="info"></p-tag></td>
          <td style="text-align: right;">
            <button pButton icon="pi pi-pencil" (click)="editCategory(c)" class="p-button-secondary p-button-sm mr-2"></button>
            <button pButton icon="pi pi-trash" (click)="deleteCategory(c)" class="p-button-danger p-button-sm"></button>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No categories configured yet.
          </td>
        </tr>
      </ng-template>
    </p-table>

    <!-- PrimeNG Modal Dialog -->
    <p-dialog 
      [(visible)]="isModalOpen" 
      [header]="currentCategory.id ? 'Edit Category' : 'New Category'" 
      [modal]="true" 
      [style]="{ width: '450px' }">
      <form (ngSubmit)="saveCategory()">
        <div class="form-group">
          <label class="form-label">Category Name *</label>
          <input pInputText type="text" [(ngModel)]="currentCategory.name" name="name" required placeholder="e.g. Solar Equipment" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea pInputText [(ngModel)]="currentCategory.description" name="description" rows="3" placeholder="Brief category description..."></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" pButton label="Cancel" (click)="closeModal()" class="p-button-secondary"></button>
          <button type="submit" pButton label="Save Category" icon="pi pi-check" class="p-button-primary"></button>
        </div>
      </form>
    </p-dialog>
  `
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  isModalOpen: boolean = false;
  currentCategory: Category = { name: '', description: '' };

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(data => this.categories = data);
  }

  openModal(): void {
    this.currentCategory = { name: '', description: '' };
    this.isModalOpen = true;
  }

  editCategory(c: Category): void {
    this.currentCategory = { ...c };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveCategory(): void {
    if (this.currentCategory.id) {
      this.categoryService.updateCategory(this.currentCategory.id, this.currentCategory).subscribe(() => {
        this.loadCategories();
        this.closeModal();
      });
    } else {
      this.categoryService.createCategory(this.currentCategory).subscribe(() => {
        this.loadCategories();
        this.closeModal();
      });
    }
  }

  deleteCategory(c: Category): void {
    if (confirm(`Delete category "${c.name}"?`)) {
      this.categoryService.deleteCategory(c.id!).subscribe(() => this.loadCategories());
    }
  }
}
