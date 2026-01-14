// services.routes.ts
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '', // Ruta base: /auth
      pathMatch: 'full',
      redirectTo: 'login',
  },
  {
    path: 'login', // Ruta: /services/add
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  // {
  //   path: 'edit/:id', // Ruta: /services/edit/1
  //   loadComponent: () => import('./edit/edit.services.component').then(m => m.EditServicesComponent)
  // }
];
