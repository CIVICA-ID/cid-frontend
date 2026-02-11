import { Routes } from '@angular/router';
import { ListComponent } from '@/modules/medical_area/list/component';
import { SaveComponent } from '@/modules/medical_area/save/component';
import { ViewComponent } from '@/modules/medical_area/view/component';

export const ROLES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('../list/component').then((m) => m.ListComponent)
    },
    {
        path: 'save',
        loadComponent: () => import('../save/component').then((m) => m.SaveComponent)
    },
    {
        path: 'view/:id',
        loadComponent: () => import('../view/component').then((m) => m.ViewComponent)
    }
];
