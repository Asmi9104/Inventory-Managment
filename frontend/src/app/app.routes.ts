import { Routes } from '@angular/router';
import { ProductsComponent } from './pages/products/products.component';

export const routes: Routes = [
  { path: '', component: ProductsComponent },
  { path: 'inventory', component: ProductsComponent },
  { path: 'products', component: ProductsComponent },
  { path: '**', redirectTo: '' }
];
