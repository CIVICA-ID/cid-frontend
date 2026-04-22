import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionService } from '@/services/session.service';
import { SKIP_AUTH_INTERCEPTOR } from '@/services/auth-session.model';
import { IdempotencyClientService } from '@/services/idempotency-client.service';

const AUTH_URL_SEGMENTS = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/validate-token-reset', '/auth/confirm'];
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function shouldSkipAuth(reqUrl: string, skipFlag: boolean): boolean {
    return skipFlag || AUTH_URL_SEGMENTS.some((segment) => reqUrl.includes(segment));
}

function shouldAttachIdempotencyKey(reqUrl: string, method: string): boolean {
    return MUTATING_METHODS.has(method.toUpperCase()) && !AUTH_URL_SEGMENTS.some((segment) => reqUrl.includes(segment));
}

function createIdempotencyKey(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }

    return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function stableSerialize(value: unknown): string {
    if (value === null || value === undefined) {
        return 'null';
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

function buildSignature(req: { method: string; url: string; body: unknown }): string {
    return `${req.method.toUpperCase()}|${req.url}|${stableSerialize(req.body)}`;
}

export const httpInterceptorService: HttpInterceptorFn = (req, next) => {
    const sessionService = inject(SessionService);
    const idempotencyClient = inject(IdempotencyClientService);
    const router = inject(Router);
    const skipAuth = req.context.get(SKIP_AUTH_INTERCEPTOR);
    const requestSignature = buildSignature(req);
    const shouldUseIdempotency = shouldAttachIdempotencyKey(req.url, req.method);

    const requestWithIdempotency = shouldUseIdempotency
        ? req.clone({
              setHeaders: {
                  'Idempotency-Key': idempotencyClient.getOrCreateKey(requestSignature)
              }
          })
        : req;

    if (shouldSkipAuth(req.url, skipAuth)) {
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

            if (shouldSkipAuth(req.url, false)) {
                sessionService.logout();
                router.navigate(['/auth/login']);
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
