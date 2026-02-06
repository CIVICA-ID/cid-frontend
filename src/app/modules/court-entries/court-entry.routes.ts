import { Routes } from '@angular/router';

export const COURT_ENTRY_ROUTES: Routes = [
    {
        path: '', // Ruta base:
        loadComponent: () => import('./list/list.court-entry.component').then((m) => m.ListCourtEntryComponent)
    }
    // {
    //   path: 'add', // Ruta:
    //   loadComponent: () => import('./add/add.users.component').then(m => m.AddUsersComponent),
    // },
    // {
    //   path: 'edit/:id', //
    //   loadComponent: () => import('./edit/edit.users.component').then(m => m.EditUsersComponent),
    // }
];
