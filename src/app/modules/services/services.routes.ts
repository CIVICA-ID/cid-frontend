// roles.routes.ts
import { Routes } from '@angular/router';

export const SERVICES_ROUTES: Routes = [
  {
    path: '', // Ruta base: /services
    loadComponent: () => import('./list/list.services.component').then(m => m.ListServicesComponent)
  },
  {
    path: 'add', // Ruta: /services/add
    loadComponent: () => import('./add/add.services.component').then(m => m.AddServicesComponent)
  },
  {
    path: 'edit/:id', // Ruta: /services/edit/1
    loadComponent: () => import('./edit/edit.services.component').then(m => m.EditServicesComponent)
  }
];
