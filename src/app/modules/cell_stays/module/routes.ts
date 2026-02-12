import { Routes } from '@angular/router';

export const CELL_STAYS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../list/component').then((m) => m.ListComponent)
  },
  {
    path: 'add',
    loadComponent: () => import('../save/component').then((m) => m.SaveComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('../save/component').then((m) => m.SaveComponent)
  },
  {
    path: 'view/:id',
    loadComponent: () => import('../view/component').then((m) => m.ViewComponent)
  }
];
