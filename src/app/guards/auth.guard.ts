import { ActivatedRouteSnapshot, CanActivateFn, Route, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@/services/auth.service';
import { SessionService } from '@/services/session.service';
import { jwtDecode } from 'jwt-decode';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state) => {
    const authService: AuthService = inject(AuthService);
    const router: Router = inject(Router);
    const sessionService: SessionService = inject(SessionService);
    const http: HttpClient = inject(HttpClient);
    const validatorURL = `${environment.apiUrl}auth/validator`;
    try {
        //verifico si el token aun existe y es valido, esta es la primer etapa de validacion
        const val: any = jwtDecode(sessionService.getToken());
        const expirationTime = val.exp * 1000;
        if (Date.now() >= expirationTime) {
            console.log('Token expirado');
            sessionService.logout();
            return router.parseUrl('/auth');
        }
    } catch (error) {
        console.log('Token invalido');
        sessionService.logout();
        return router.parseUrl('/auth');
    }
    const httpHeaders = new HttpHeaders({ 'x-access-token': sessionService.getToken() as string });
    const options = { headers: httpHeaders };
    const module = route.data['module'];
    const params = new HttpParams().set('module', module);
    try {
        // Convertimos el post en una promesa y esperamos la respuesta
        const response = await firstValueFrom(http.post(validatorURL, params, options));
        return true; // Acceso permitido
    } catch (error: any) {

        if (error.status === 401) {
            sessionService.logout();
            return router.parseUrl('/auth');
        } else if (error.status === 404) {
            return router.parseUrl('/notfound');
        } else if (error.status === 403) {
            return router.parseUrl('/'); // Regreso a inicio
        }

        // Error genérico
        return router.parseUrl('/error');
    }
    return true;
};
