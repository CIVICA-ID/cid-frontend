import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionService } from '@/services/session.service';
import { SKIP_AUTH_INTERCEPTOR } from '@/services/auth-session.model';
import { IdempotencyClientService } from '@/services/idempotency-client.service';

const AUTH_URL_SEGMENTS = [
    '/auth/login',
    '/auth/refresh',
    '/auth/logout',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/validate-token-reset',
    '/auth/confirm',
    '/auth/validator'
];
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function shouldSkipAuth(reqUrl: string, skipFlag: boolean): boolean {
    return skipFlag || AUTH_URL_SEGMENTS.some((segment) => reqUrl.includes(segment));
}

function shouldAttachIdempotencyKey(reqUrl: string, method: string): boolean {
    return MUTATING_METHODS.has(method.toUpperCase()) && !AUTH_URL_SEGMENTS.some((segment) => reqUrl.includes(segment));
}

function stableSerialize(value: unknown): string {
    if (value === null || value === undefined) {
        return 'null';
    }

    if (value instanceof Date) {
        return `Date(${value.toISOString()})`;
    }

    if (typeof FormData !== 'undefined' && value instanceof FormData) {
        const entries = Array.from(value.entries()).map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`);
        return `FormData{${entries.join(',')}}`;
    }

    if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) {
        return `URLSearchParams(${value.toString()})`;
    }

    if (typeof File !== 'undefined' && value instanceof File) {
        return `File(${JSON.stringify(value.name)},${value.type || 'application/octet-stream'},${value.size})`;
    }

    if (typeof Blob !== 'undefined' && value instanceof Blob) {
        return `Blob(${value.type || 'application/octet-stream'},${value.size})`;
    }

    if (typeof value !== 'object') {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
    }

    const entries = Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key])}`);

    return `{${entries.join(',')}}`;
}

function buildSignature(req: HttpRequest<unknown>, branch: string | null): string {
    return `${req.method.toUpperCase()}|${req.urlWithParams}|${branch ?? ''}|${stableSerialize(req.body)}`;
}

export const httpInterceptorService: HttpInterceptorFn = (req, next) => {
    const sessionService = inject(SessionService);
    const idempotencyClient = inject(IdempotencyClientService);
    const router = inject(Router);
    const skipAuth = req.context.get(SKIP_AUTH_INTERCEPTOR);
    const branch = sessionService.getBranch();
    const requestSignature = buildSignature(req, branch);
    const shouldUseIdempotency = shouldAttachIdempotencyKey(req.urlWithParams, req.method);

    const requestWithIdempotency = shouldUseIdempotency
        ? req.clone({
              setHeaders: {
                  'Idempotency-Key': idempotencyClient.getOrCreateKey(requestSignature)
              }
          })
        : req;

    if (shouldSkipAuth(req.urlWithParams, skipAuth)) {
        return next(requestWithIdempotency);
    }

    return idempotencyClient.getOrShare(requestSignature, () => sessionService.ensureFreshAccessToken().pipe(
        switchMap((accessToken) => {
            const authReq = requestWithIdempotency.clone({
                setHeaders: {
                    'x-access-token': accessToken,
                    'x-access-branch': sessionService.getBranch() ?? ''
                }
            });

            return next(authReq);
        }),
        catchError((error: HttpErrorResponse) => {
            if (error.status !== 401) {
                if (error.status === 403) {
                    router.navigate(['/']);
                }
                return throwError(() => error);
            }

            return sessionService.refreshAccessToken().pipe(
                switchMap((newAccessToken) => {
                    const retryReq = requestWithIdempotency.clone({
                        setHeaders: {
                            'x-access-token': newAccessToken,
                            'x-access-branch': sessionService.getBranch() ?? ''
                        }
                    });

                    return next(retryReq);
                }),
                catchError((refreshError) => {
                    sessionService.logout();
                    router.navigate(['/auth/login']);
                    return throwError(() => refreshError);
                })
            );
        })
    ));
};
