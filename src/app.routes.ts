import { Routes } from '@angular/router';
import { AppLayout } from '@/layout/components/app.layout';
import { Notfound } from '@/pages/notfound/notfound';
import { LandingLayout } from '@/layout/components/app.landinglayout';
import { AuthLayout } from '@/layout/components/app.authlayout';
import { authGuard } from '@/guards/auth.guard';

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
                loadChildren: () => import('./app/modules/services/services.routes').then(m => m.SERVICES_ROUTES),
                data: { breadcrumb: 'Servicios',module:'services' }
            },
            {
                path: 'uikit',
                data: { breadcrumb: 'UI Kit' },
                loadChildren: () => import('@/pages/uikit/uikit.routes')
            },
            {
                path: 'documentation',
                data: { breadcrumb: 'Documentation' },
                loadComponent: () => import('@/pages/documentation/documentation').then((c) => c.Documentation)
            },
            {
                path: 'pages',
                loadChildren: () => import('@/pages/pages.routes'),
                data: { breadcrumb: 'Pages' }
            },
            {
                path: 'apps',
                loadChildren: () => import('@/apps/apps.routes'),
                data: { breadcrumb: 'Apps' }
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
        loadChildren: () => import('./app/modules/auth/auth.routes').then((c) => c.AUTH_ROUTES),
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
    {path : 'error', component : Notfound},
    {path : 'notfound', component: Notfound},
];
