import { Routes } from '@angular/router';

export const BRANCHES_ROUTES: Routes = [
    {
        path: '', // Ruta base:
        loadComponent: () => import('./list/list.branches.component').then((m) => m.ListBranchesComponent)
    },
    {
        path: 'add', // Ruta:
        loadComponent: () => import('./add/add.branches.component').then((m) => m.AddBranchesComponent)
    },
    {
        path: 'edit/:id', //
        loadComponent: () => import('./edit/edit.branches.component').then((m) => m.EditBranchesComponent)
    }
];
