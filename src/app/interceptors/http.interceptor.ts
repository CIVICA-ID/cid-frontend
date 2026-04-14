import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { jwtDecode, InvalidTokenError } from 'jwt-decode';
import { environment } from '../../environments/environment'; // Ajusta la ruta
import { SessionService } from '@/services/session.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@/services/auth.service';

let isRenovated:boolean = false;

export const httpInterceptorService: HttpInterceptorFn = (req, next) => {
    const sessionService = inject(SessionService);
    const router = inject(Router);
    const authService: AuthService = inject(AuthService);
    let tkn='';
    let branch = '';
    const rawToken = sessionService.getToken();
    if (rawToken) {
        try {
            const decoded: any = jwtDecode(rawToken);
            const now = Math.floor(Date.now() / 1000);
            const activity = (decoded.exp - now) / 60;
            if (activity <= 15 && !isRenovated) {
                isRenovated = true;
                authService.renovateToken().subscribe({
                    next: (data: any) => {
                        sessionService.setToken(data.token);
                        isRenovated = false;
                    },
                    error: (err: any) => {
                        isRenovated = false;
                    }
                });
            }
            if (decoded.exp && now >= decoded.exp) {
                localStorage.clear();
            } else {
                tkn = rawToken;
                const currentBranch = sessionService.getBranch();
                branch = currentBranch !== null ? currentBranch : '';
            }
        } catch (error) {
            localStorage.clear();
            if (error instanceof InvalidTokenError) {
                console.error('Invalid JWT token:', error.message);
            } else {
                console.error('Error decoding JWT:', error);
            }
        }
    } else {
        localStorage.clear();
    }

    // se agregan los headers
    const cloneReq = req.clone({
        setHeaders: {
            'x-access-token': tkn,
            'x-access-branch': branch
            //   'x-app-version': environment.appVersion
        }
    });

    // return next(cloneReq);
    return next(cloneReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Aquí es donde capturamos el 403 que mencionaste
            if (error.status === 403) {
                // Redirigimos al usuario para que no se quede en la página vacía
                router.navigate(['/']);
            } else if (error.status === 401) {
                sessionService.logout();
                router.navigate(['/auth/login']);
            }

            return throwError(() => error);
        })
    );
};
