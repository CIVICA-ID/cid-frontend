import { Routes } from '@angular/router';

export const SUCURSALES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./selector/sucursales.component').then((m) => m.SucursalesComponent)
    }
];
