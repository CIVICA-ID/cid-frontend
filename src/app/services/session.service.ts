import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '@/services/auth.service';
import { IdempotencyClientService } from '@/services/idempotency-client.service';
import { SessionStorageAdapter } from '@/services/session-storage.adapter';
import { APP_CONFIG } from '@/config.token';
import { AuthLoginResponse, RefreshRequest, SessionSnapshot, SKIP_AUTH_INTERCEPTOR } from './auth-session.model';

const authStorageKey = 'auth_session';
const legacyAccessTokenKey = 'bearer';
const accessTokenRefreshBufferMs = 10_000;

interface JwtPayload {
    exp?: number;
}

@Injectable({
    providedIn: 'root'
})
export class SessionService {
    public fullName: string | null = null;
    public image: string | null = null;
    public id: string | null = null;
    public rights: unknown = null;
    public branch: string | null = null;
    public email: string | null = null;
    public nickName: string | null = null;

    private readonly authService = inject(AuthService);
    private readonly idempotencyClient = inject(IdempotencyClientService);
    private readonly storage = inject(SessionStorageAdapter);
    private readonly appConfig = inject(APP_CONFIG);
    private accessToken: string | null = null;
    private accessTokenExpiresAt: number | null = null;
    private refreshRequest$?: Observable<string>;
    private refreshTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(private http: HttpClient) {
        this.rehydrateSession();
    }

    register(user: any) {
        return this.http.post(`${this.appConfig.apiUrl}auth/register`, user, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    verification(token: string) {
        const params = new HttpParams().set('token', token);
        return this.http.get(`${this.appConfig.apiUrl}auth/confirm`, {
            params,
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    login(user: any) {
        return this.http.post(`${this.appConfig.apiUrl}auth/login/`, user, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    logout() {
        const accessToken = this.getAccessToken();
        const branch = this.getBranch() ?? '';

        this.http.post(
            `${this.appConfig.apiUrl}auth/logout`,
            {
                accessToken: accessToken ?? undefined
            },
            {
                context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
                withCredentials: true,
                headers: accessToken
                    ? new HttpHeaders({
                          'x-access-token': accessToken,
                          'x-access-branch': branch
                      })
                    : new HttpHeaders()
            }
        ).subscribe({
            next: () => undefined,
            error: () => undefined
        });

        this.clearScheduledRefresh();
        this.idempotencyClient.clear();
        this.clearAuthStorage();
    }

    forgotPassword(email: any) {
        return this.http.post(`${this.appConfig.apiUrl}auth/forgot-password`, email, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    resetPassword(data: any) {
        return this.http.post(`${this.appConfig.apiUrl}auth/reset-password`, data, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    validateTokenReset(data: any) {
        return this.http.post(`${this.appConfig.apiUrl}auth/validate-token-reset`, data, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    setToken(token: string) {
        this.applyAccessToken(token);
    }

    setSession(response: AuthLoginResponse) {
        const accessToken = response.accessToken ?? response.token ?? null;
        if (!accessToken) {
            return;
        }

        this.applyAccessToken(accessToken, response.expiresAt, response.expiresIn);
        this.persistSessionMetadata({
            branch: response.branch ?? this.getBranch(),
            fullName: response.fullName ?? this.getFullName(),
            image: response.image ?? this.getRawImageId(),
            id: response.id ?? this.getId(),
            rights: response.rights ?? this.getRights(),
            email: response.email ?? this.getEmail(),
            nickName: response.nickName ?? this.getNickName()
        });
    }

    getToken(): string | null {
        return this.getAccessToken();
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    getBranches(nickName: string) {
        return this.http.get(`${this.appConfig.apiUrl}auth/branches/${nickName}`);
    }

    setFullName(name: string) {
        this.storage.setItem('name', name);
        this.fullName = name;
        this.persistSessionMetadata({ ...this.getStoredSession(), fullName: name });
    }

    getFullName(): string | null {
        return this.storage.getItem('name');
    }

    setImage(uimage: string) {
        this.storage.setItem('image', uimage);
        this.image = `${this.appConfig.apiUrl}file/download?id=${uimage}`;
        this.persistSessionMetadata({ ...this.getStoredSession(), image: uimage });
    }

    getImage(): string | null {
        const imageId = this.getRawImageId();
        return imageId ? `${this.appConfig.apiUrl}file/download?id=${imageId}` : null;
    }

    setId(id: string) {
        this.storage.setItem('id', id);
        this.id = id;
        this.persistSessionMetadata({ ...this.getStoredSession(), id });
    }

    getId(): string | null {
        return this.storage.getItem('id');
    }

    setRights(rights: unknown) {
        this.storage.setItem('rights', JSON.stringify(rights));
        this.rights = rights;
        this.persistSessionMetadata({ ...this.getStoredSession(), rights });
    }

    getRights(): unknown | null {
        const rawRights = this.storage.getItem('rights');
        if (!rawRights) {
            return null;
        }

        try {
            return JSON.parse(rawRights);
        } catch {
            return null;
        }
    }

    setBranch(branch: string) {
        this.storage.setItem('branch', branch);
        this.branch = branch;
        this.persistSessionMetadata({ ...this.getStoredSession(), branch });
    }

    getBranch(): string | null {
        return this.storage.getItem('branch');
    }

    setEmail(email: string) {
        this.storage.setItem('email', email);
        this.email = email;
        this.persistSessionMetadata({ ...this.getStoredSession(), email });
    }

    getEmail(): string | null {
        return this.storage.getItem('email');
    }

    setNickName(nickName: string) {
        this.storage.setItem('nickName', nickName);
        this.nickName = nickName;
        this.persistSessionMetadata({ ...this.getStoredSession(), nickName });
    }

    getNickName(): string | null {
        return this.storage.getItem('nickName');
    }

    isAccessTokenExpired(bufferMs = 0): boolean {
        const token = this.getAccessToken();
        if (!token) {
            return true;
        }

        const expiresAt = this.accessTokenExpiresAt ?? this.resolveAccessTokenExpiresAt(token);
        return expiresAt !== null ? Date.now() + bufferMs >= expiresAt : false;
    }

    ensureFreshAccessToken(bufferMs = accessTokenRefreshBufferMs): Observable<string> {
        const currentToken = this.getAccessToken();
        if (currentToken && !this.isAccessTokenExpired(bufferMs)) {
            return of(currentToken);
        }

        return this.refreshAccessToken();
    }

    refreshAccessToken(): Observable<string> {
        if (this.refreshRequest$) {
            return this.refreshRequest$;
        }

        const request: RefreshRequest = {
            branch: this.getBranch()
        };

        this.refreshRequest$ = this.authService.refresh(request).pipe(
            map((response: AuthLoginResponse) => {
                const accessToken = response.accessToken ?? response.token;
                if (!accessToken) {
                    throw new Error('Refresh response did not include an access token');
                }

                this.setSession({
                    accessToken,
                    expiresAt: response.expiresAt,
                    expiresIn: response.expiresIn,
                    branch: response.branch,
                    fullName: response.fullName,
                    image: response.image,
                    id: response.id,
                    rights: response.rights,
                    email: response.email,
                    nickName: response.nickName
                });

                return accessToken;
            }),
            catchError((error) => {
                this.logout();
                return throwError(() => error);
            }),
            finalize(() => {
                this.refreshRequest$ = undefined;
            }),
            shareReplay({ bufferSize: 1, refCount: false })
        );

        return this.refreshRequest$;
    }

    private applyAccessToken(token: string, expiresAt?: string | number | Date | null, expiresIn?: number) {
        this.accessToken = token;
        this.accessTokenExpiresAt = this.resolveAccessTokenExpiresAt(token, expiresAt, expiresIn);
        this.scheduleRefresh();
    }

    private persistSessionMetadata(session: Partial<SessionSnapshot>) {
        const current = this.getStoredSession();
        const nextSession: SessionSnapshot = {
            branch: session.branch ?? current.branch ?? this.storage.getItem('branch'),
            fullName: session.fullName ?? current.fullName ?? this.storage.getItem('name'),
            image: session.image ?? current.image ?? this.storage.getItem('image'),
            id: session.id ?? current.id ?? this.storage.getItem('id'),
            rights: session.rights ?? current.rights ?? this.getRights(),
            email: session.email ?? current.email ?? this.storage.getItem('email'),
            nickName: session.nickName ?? current.nickName ?? this.storage.getItem('nickName'),
            accessTokenExpiresAt: session.accessTokenExpiresAt ?? current.accessTokenExpiresAt ?? this.accessTokenExpiresAt ?? null
        };

        this.storage.setItem(authStorageKey, JSON.stringify(nextSession));
        if (nextSession.branch) {
            this.storage.setItem('branch', nextSession.branch);
        }
        if (nextSession.fullName) {
            this.storage.setItem('name', nextSession.fullName);
        }
        if (nextSession.image) {
            this.storage.setItem('image', nextSession.image);
        }
        if (nextSession.id) {
            this.storage.setItem('id', nextSession.id);
        }
        if (nextSession.rights !== undefined && nextSession.rights !== null) {
            this.storage.setItem('rights', JSON.stringify(nextSession.rights));
        }
        if (nextSession.email) {
            this.storage.setItem('email', nextSession.email);
        }
        if (nextSession.nickName) {
            this.storage.setItem('nickName', nextSession.nickName);
        }

        this.accessSnapshotToPublicFields(nextSession);
    }

    private accessSnapshotToPublicFields(session: SessionSnapshot) {
        this.fullName = session.fullName ?? null;
        this.image = session.image ? `${this.appConfig.apiUrl}file/download?id=${session.image}` : null;
        this.id = session.id ?? null;
        this.rights = session.rights ?? null;
        this.branch = session.branch ?? null;
        this.email = session.email ?? null;
        this.nickName = session.nickName ?? null;
    }

    private scheduleRefresh(session?: Partial<SessionSnapshot>) {
        this.clearScheduledRefresh();

        const expiresAt = session?.accessTokenExpiresAt ?? this.accessTokenExpiresAt;
        if (!expiresAt) {
            return;
        }

        const delay = Math.max(expiresAt - Date.now() - accessTokenRefreshBufferMs, 5_000);
        this.refreshTimer = setTimeout(() => {
            this.refreshAccessToken().subscribe({
                next: () => undefined,
                error: () => this.logout()
            });
        }, delay);
    }

    private clearScheduledRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
        this.refreshRequest$ = undefined;
    }

    private rehydrateSession() {
        const storedSession = this.getStoredSession();
        const legacyToken = this.readLegacyAccessToken();
        if (storedSession.branch || storedSession.fullName || storedSession.image || storedSession.id || storedSession.rights || storedSession.email || storedSession.nickName || storedSession.accessTokenExpiresAt) {
            this.persistSessionMetadata(storedSession);
        }

        if (legacyToken) {
            this.applyAccessToken(legacyToken);
            this.clearLegacyAccessTokenStorage();
        }
    }

    private clearAuthStorage() {
        const keys = [
            authStorageKey,
            legacyAccessTokenKey,
            'name',
            'image',
            'id',
            'rights',
            'branch',
            'email',
            'nickName'
        ];

        keys.forEach((key) => this.storage.removeItem(key));
        this.clearAccessTokenState();
        this.fullName = null;
        this.image = null;
        this.id = null;
        this.rights = null;
        this.branch = null;
        this.email = null;
        this.nickName = null;
    }

    private clearAccessTokenState() {
        this.accessToken = null;
        this.accessTokenExpiresAt = null;
    }

    private getStoredSession(): SessionSnapshot {
        const rawSession = this.storage.getItem(authStorageKey);
        if (!rawSession) {
            return {
                branch: this.storage.getItem('branch'),
                fullName: this.storage.getItem('name'),
                image: this.storage.getItem('image'),
                id: this.storage.getItem('id'),
                rights: this.getRights(),
                email: this.storage.getItem('email'),
                nickName: this.storage.getItem('nickName')
            };
        }

        try {
            const parsed = JSON.parse(rawSession) as Partial<SessionSnapshot>;
            return {
                branch: parsed.branch ?? this.storage.getItem('branch'),
                fullName: parsed.fullName ?? this.storage.getItem('name'),
                image: parsed.image ?? this.storage.getItem('image'),
                id: parsed.id ?? this.storage.getItem('id'),
                rights: parsed.rights ?? this.getRights(),
                email: parsed.email ?? this.storage.getItem('email'),
                nickName: parsed.nickName ?? this.storage.getItem('nickName'),
                accessTokenExpiresAt: parsed.accessTokenExpiresAt ?? null
            };
        } catch {
            return {
                branch: this.storage.getItem('branch'),
                fullName: this.storage.getItem('name'),
                image: this.storage.getItem('image'),
                id: this.storage.getItem('id'),
                rights: this.getRights(),
                email: this.storage.getItem('email'),
                nickName: this.storage.getItem('nickName')
            };
        }
    }

    private readLegacyAccessToken(): string | null {
        const bearerToken = this.storage.getItem(legacyAccessTokenKey);
        if (bearerToken) {
            return bearerToken;
        }

        const rawSession = this.storage.getItem(authStorageKey);
        if (!rawSession) {
            return null;
        }

        try {
            const parsed = JSON.parse(rawSession) as { accessToken?: string };
            return parsed.accessToken ?? null;
        } catch {
            return null;
        }
    }

    private clearLegacyAccessTokenStorage() {
        this.storage.removeItem(legacyAccessTokenKey);
        const storedSession = this.getStoredSession();
        this.persistSessionMetadata(storedSession);
    }

    private resolveAccessTokenExpiresAt(token: string, expiresAt?: string | number | Date | null, expiresIn?: number): number | null {
        const explicitExpiration = this.resolveTimestamp(expiresAt);
        if (explicitExpiration !== null) {
            return explicitExpiration;
        }

        if (typeof expiresIn === 'number' && Number.isFinite(expiresIn)) {
            return Date.now() + expiresIn * 1000;
        }

        try {
            const decoded = jwtDecode<JwtPayload>(token);
            if (decoded?.exp) {
                return decoded.exp * 1000;
            }
        } catch {
            return null;
        }

        return null;
    }

    private resolveTimestamp(value?: string | number | Date | null): number | null {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        if (value instanceof Date) {
            return value.getTime();
        }

        if (typeof value === 'number') {
            return value > 10_000_000_000 ? value : value * 1000;
        }

        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? null : parsed;
    }

    private getRawImageId(): string | null {
        return this.storage.getItem('image');
    }
}
