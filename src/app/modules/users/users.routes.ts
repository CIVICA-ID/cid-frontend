import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '', // Ruta base:
    loadComponent: () => import('./list/list.users.component').then(m => m.ListUsersComponent),
  },
  {
    path: 'add', // Ruta:
    loadComponent: () => import('./add/add.users.component').then(m => m.AddUsersComponent),
  },
  {
    path: 'edit/:id', //
    loadComponent: () => import('./edit/edit.users.component').then(m => m.EditUsersComponent),
  }
];
