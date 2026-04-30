import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '@/services/session.service';
import { APP_CONFIG } from '@/config.token';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
    const router: Router = inject(Router);
    const sessionService: SessionService = inject(SessionService);
    const http: HttpClient = inject(HttpClient);
    const appConfig = inject(APP_CONFIG);
    const validatorURL = `${appConfig.apiUrl}auth/validator`;

    try {
        await firstValueFrom(sessionService.ensureFreshAccessToken());
    } catch {
        sessionService.logout();
        return router.parseUrl('/auth/login');
    }

    const accessToken = sessionService.getAccessToken();
    if (!accessToken) {
        sessionService.logout();
        return router.parseUrl('/auth/login');
    }

    const module = route.data['module'] ?? route.parent?.data['module'] ?? route.routeConfig?.path;
    if (typeof module !== 'string' || module.trim().length === 0) {
        return router.parseUrl('/error');
    }

    const params = new HttpParams().set('module', module);
    const httpHeaders = new HttpHeaders({
        'x-access-token': accessToken,
        'x-access-branch': sessionService.getBranch() ?? ''
    });
    const options = { headers: httpHeaders };

    try {
        await firstValueFrom(http.post(validatorURL, params, options));
        return true;
    } catch (error: any) {
        if (error.status === 401) {
            sessionService.logout();
            return router.parseUrl('/auth/login');
        }

        if (error.status === 404) {
            return router.parseUrl('/notfound');
        }

        if (error.status === 403) {
            return router.parseUrl('/');
        }

        return router.parseUrl('/error');
    }
};
