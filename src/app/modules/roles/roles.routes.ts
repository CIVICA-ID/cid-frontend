import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  {
    path: '', // Ruta base: /services
    loadComponent: () => import('./list/list.roles.component').then(m => m.ListRolesComponent)
  },
  {
    path: 'add', // Ruta: /services/add
    loadComponent: () => import('./add/add.roles.component').then(m => m.AddRolesComponent)
  },
  {
    path: 'edit/:id', // Ruta: /services/edit/1
    loadComponent: () => import('./edit/edit.roles.component').then(m => m.EditRolesComponent)
  }
];
