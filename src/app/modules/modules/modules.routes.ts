import { Routes } from '@angular/router';

export const MODULES_ROUTES: Routes = [
  {
    path: '', // Ruta base:
    loadComponent: () => import('./list/list.modules.component').then(m => m.ListModulesComponent),
  },
  {
    path: 'add', // Ruta:
    loadComponent: () => import('./add/add.modules.component').then(m => m.AddModulesComponent),
  },
  {
    path: 'edit/:id', //
    loadComponent: () => import('./edit/edit.modules.component').then(m => m.EditModulesComponent),
  }
];
