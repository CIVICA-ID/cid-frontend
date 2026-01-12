import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { jwtDecode, InvalidTokenError } from 'jwt-decode';
import { environment } from '../../environments/environment'; // Ajusta la ruta
import { SessionService } from '@/services/session.service';

export const httpInterceptorService: HttpInterceptorFn = (req, next) => {
    const sessionService = inject(SessionService);

    let tkn = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOWZmYjFhNC03MzAwLTRhZWYtYTllZS1mNTkzYjEzOWZjMGQiLCJ1c2VybmFtZSI6IkRpZWdvMSIsImlhdCI6MTc2ODIyOTU1OCwiZXhwIjoxNzY4MzE1OTU4fQ.rPM-6LQppRSguchkOowgRo6zBrjkNhe5-h3AsylYWkk';
    let branch = '';
    const rawToken = sessionService.getToken();

    if (rawToken) {
        try {
            const decoded: any = jwtDecode(rawToken);
            const now = Math.floor(Date.now() / 1000);

            if (decoded.exp && now >= decoded.exp) {
                localStorage.clear();
            } else {
                tkn = rawToken;
                // const currentBranch = sessionService.getBranch();
                // branch = currentBranch !== null ? currentBranch : '';
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
            // 'x-access-branch': branch
            //   'x-app-version': environment.appVersion
        }
    });

    return next(cloneReq);
};
