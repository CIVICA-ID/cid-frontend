import { Routes } from '@angular/router';

export const MEDICAL_AREA_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./list/list.medical-area.component').then((m) => m.ListMedicalAreaComponent)
    },
    {
        path: 'add',
        loadComponent: () => import('./add/add.medical-area.component').then((m) => m.AddMedicalAreaComponent)
    },
    {
        path: 'edit/:id',
        loadComponent: () => import('./edit/edit.medical-area.component').then((m) => m.EditMedicalAreaComponent)
    }
];
