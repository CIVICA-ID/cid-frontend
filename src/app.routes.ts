import { Routes } from '@angular/router';
import { AppLayout } from '@/layout/components/app.layout';
import { Notfound } from '@/pages/notfound/notfound';
import { LandingLayout } from '@/layout/components/app.landinglayout';
import { AuthLayout } from '@/layout/components/app.authlayout';
import { authGuard } from '@/guards/auth.guard';
import { BRANCHES_ROUTES } from '@/modules/branches/branches.routes';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivateChild: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('@/pages/dashboards/ecommerce/ecommercedashboard').then((c) => c.EcommerceDashboard),
                data: { breadcrumb: 'E-Commerce Dashboard' }
            },
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
                path: 'blocks',
                data: { breadcrumb: 'Free Blocks' },
                loadChildren: () => import('@/pages/blocks/blocks.routes')
            },
            {
                path: 'ecommerce',
                loadChildren: () => import('@/pages/ecommerce/ecommerce.routes'),
                data: { breadcrumb: 'E-Commerce' }
            },
            {
                path: 'profile',
                loadChildren: () => import('@/pages/usermanagement/usermanagement.routes')
            }
        ]
    },
    {
        path: 'auth',
        loadChildren: () => import('./app/modules/auth/auth.routes').then((c) => c.AUTH_ROUTES)
    },
    {
        path: 'landing',
        component: LandingLayout,
        children: [
            {
                path: '',
                loadComponent: () => import('@/pages/landing/landingpage').then((c) => c.LandingPage)
            },
            {
                path: 'features',
                loadComponent: () => import('@/pages/landing/featurespage').then((c) => c.FeaturesPage)
            },
            {
                path: 'pricing',
                loadComponent: () => import('@/pages/landing/pricingpage').then((c) => c.PricingPage)
            },
            {
                path: 'contact',
                loadComponent: () => import('@/pages/landing/contactpage').then((c) => c.ContactPage)
            }
        ]
    },
    // {
    //     path: 'auth',
    //     component: AuthLayout,
    //     children: [
    //         {
    //             path: 'login',
    //             loadComponent: () => import('@/pages/auth/login').then((c) => c.Login)
    //         },
    //         {
    //             path: 'register',
    //             loadComponent: () => import('@/pages/auth/register').then((c) => c.Register)
    //         },
    //         {
    //             path: 'verification',
    //             loadComponent: () => import('@/pages/auth/verification').then((c) => c.Verification)
    //         },
    //         {
    //             path: 'forgot-password',
    //             loadComponent: () => import('@/pages/auth/forgotpassword').then((c) => c.ForgotPassword)
    //         },
    //         {
    //             path: 'new-password',
    //             loadComponent: () => import('@/pages/auth/newpassword').then((c) => c.NewPassword)
    //         },
    //         {
    //             path: 'lock-screen',
    //             loadComponent: () => import('@/pages/auth/lockscreen').then((c) => c.LockScreen)
    //         },
    //         {
    //             path: 'access',
    //             loadComponent: () => import('@/pages/auth/access').then((c) => c.Access)
    //         },
    //         {
    //             path: 'oops',
    //             loadComponent: () => import('@/pages/oops/oops').then((c) => c.Oops)
    //         },
    //         {
    //             path: 'error',
    //             loadComponent: () => import('@/pages/notfound/notfound').then((c) => c.Notfound)
    //         }
    //     ]
    // },
    { path: '**', redirectTo: '/notfound' },
    { path: 'error', component: Notfound },
    { path: 'notfound', component: Notfound }
];
