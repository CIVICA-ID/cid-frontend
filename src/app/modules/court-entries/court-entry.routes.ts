import { Routes } from '@angular/router';

export const COURT_ENTRY_ROUTES: Routes = [
    {
        path: '', // Ruta base:
        loadComponent: () => import('./list/list.court-entry.component').then((m) => m.ListCourtEntryComponent)
    },
    {
        path: 'add/:idCourtEntry', // Ruta:
        loadComponent: () => import('./add/add.court-entry.component').then((m) => m.AddCourtEntryComponent)
    },
    {
        path: 'edit/:id', //
        loadComponent: () => import('./edit/edit.court-entry.component').then((m) => m.EditCourtEntryComponent)
    }
];
