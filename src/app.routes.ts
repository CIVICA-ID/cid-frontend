import { Routes } from '@angular/router';
import { AppLayout } from '@/layout/components/app.layout';
import { Notfound } from '@/pages/notfound/notfound';
import { authGuard } from '@/guards/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivateChild: [authGuard],
        children: [
            {
                path: 'services',
                loadChildren: () => import('./app/modules/services/services.routes').then((m) => m.SERVICES_ROUTES),
                data: { breadcrumb: 'Servicios', module: 'services' }
            },
            {
                path: 'roles',
                data: { breadcrumb: 'Roles', module: 'roles' },
                loadChildren: () => import('@/modules/roles/roles.routes').then((m) => m.ROLES_ROUTES)
            },
            {
                path: 'modules',
                data: { breadcrumb: 'Módulos', module: 'modules' },
                loadChildren: () => import('@/modules/modules/modules.routes').then((m) => m.MODULES_ROUTES)
            },
            {
                path: 'users',
                loadChildren: () => import('@/modules/users/users.routes').then((m) => m.USERS_ROUTES),
                data: { breadcrumb: 'Usuarios', module: 'users' }
            },
            {
                path: 'staff',
                loadChildren: () => import('@/modules/staff/module/routes').then((m) => m.STAFF_ROUTES),
                data: { breadcrumb: 'Staff', module: 'staff' }
            },
            {
                path: 'branches',
                loadChildren: () => import('@/modules/branches/branches.routes').then((m) => m.BRANCHES_ROUTES),
                data: { breadcrumb: 'Sucursales', module: 'branches' }
            },
            {
                path: 'medical-reports',
                loadChildren: () => import('@/modules/medical_reports/module/routes').then((m) => m.MEDICAL_REPORTS_ROUTES),
                data: { breadcrumb: 'Reportes médicos', module: 'medical_reports' }
            },
            {
                path: 'psychosocial-reports',
                loadChildren: () => import('@/modules/psychosocial_reports/module/routes').then((m) => m.PSYCHOSOCIAL_REPORTS_ROUTES),
                data: { breadcrumb: 'Reportes psicosociales', module: 'psychosocial_reports' }
            },
            {
                path: 'cell-stays',
                loadChildren: () => import('@/modules/cell_stays/module/routes').then((m) => m.CELL_STAYS_ROUTES),
                data: { breadcrumb: 'Estadías en celda', module: 'cell_stays' }
            },
            {
                path: 'belongings',
                loadChildren: () => import('@/modules/belongings/module/routes').then((m) => m.BELONGINGS_ROUTES),
                data: { breadcrumb: 'Pertenencias', module: 'belongings' }
            },
            {
                path: 'freedom-tickets',
                loadChildren: () => import('@/modules/freedom_tickets/module/routes').then((m) => m.FREEDOM_TICKETS_ROUTES),
                data: { breadcrumb: 'Boletas de libertad', module: 'freedom_tickets' }
            },

            {
                path: 'court-entry',
                data: { breadcrumb: 'Registros del Juez', module: 'court_entries' },
                loadChildren: () => import('@/modules/court-entries/court-entry.routes').then(m=>m.COURT_ENTRY_ROUTES)
            },
            {
                path: 'seguimiento',
                loadChildren: () => import('@/modules/seguimiento/module/routes').then((m) => m.SEGUIMIENTO_ROUTES),
                data: { breadcrumb: 'Seguimiento', module: 'seguimiento' }
            },
        ]
    },
    {
        path: 'auth',
        loadChildren: () => import('./app/modules/auth/auth.routes').then((c) => c.AUTH_ROUTES)
    },
    { path: '**', redirectTo: '/notfound' },
    { path: 'error', component: Notfound },
    { path: 'notfound', component: Notfound }
];
