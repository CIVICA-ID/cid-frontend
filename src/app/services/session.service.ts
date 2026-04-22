import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import { AuthService } from '@/services/auth.service';
import { IdempotencyClientService } from '@/services/idempotency-client.service';
import { AuthLoginResponse, RefreshRequest, SessionSnapshot, SKIP_AUTH_INTERCEPTOR } from './auth-session.model';

const baseUrl: string = `${environment.apiUrl}auth`;
const authStorageKey = 'auth_session';
const legacyAccessTokenKey = 'bearer';
const accessTokenRefreshBufferMs = 60_000;

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
    private accessToken: string | null = null;
    private accessTokenExpiresAt: number | null = null;
    private refreshRequest$?: Observable<string>;
    private refreshTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(private http: HttpClient) {
        this.rehydrateSession();
    }

    register(user: any) {
        return this.http.post(`${baseUrl}/register`, user, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    verification(token: string) {
        const params = new HttpParams().set('token', token);
        return this.http.get(`${baseUrl}/confirm`, {
            params,
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    login(user: any) {
        return this.http.post(`${baseUrl}/login/`, user, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    logout() {
        const accessToken = this.getAccessToken();
        const branch = this.getBranch() ?? '';

        this.http.post(
            `${baseUrl}/logout`,
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
        return this.http.post(`${baseUrl}/forgot-password`, email, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    resetPassword(data: any) {
        return this.http.post(`${baseUrl}/reset-password`, data, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    validateTokenReset(data: any) {
        return this.http.post(`${baseUrl}/validate-token-reset`, data, {
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
        return this.http.get(`${baseUrl}/branches/${nickName}`);
    }

    setFullName(name: string) {
        localStorage.setItem('name', name);
        this.fullName = name;
        this.persistSessionMetadata({ ...this.getStoredSession(), fullName: name });
    }

    getFullName(): string | null {
        return localStorage.getItem('name');
    }

    setImage(uimage: string) {
        localStorage.setItem('image', uimage);
        this.image = `${environment.apiUrl}file/download?id=${uimage}`;
        this.persistSessionMetadata({ ...this.getStoredSession(), image: uimage });
    }

    getImage(): string | null {
        const imageId = this.getRawImageId();
        return imageId ? `${environment.apiUrl}file/download?id=${imageId}` : null;
    }

    setId(id: string) {
        localStorage.setItem('id', id);
        this.id = id;
        this.persistSessionMetadata({ ...this.getStoredSession(), id });
    }

    getId(): string | null {
        return localStorage.getItem('id');
    }

    setRights(rights: unknown) {
        localStorage.setItem('rights', JSON.stringify(rights));
        this.rights = rights;
        this.persistSessionMetadata({ ...this.getStoredSession(), rights });
    }

    getRights(): unknown | null {
        const rawRights = localStorage.getItem('rights');
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
        localStorage.setItem('branch', branch);
        this.branch = branch;
        this.persistSessionMetadata({ ...this.getStoredSession(), branch });
    }

    getBranch(): string | null {
        return localStorage.getItem('branch');
    }

    setEmail(email: string) {
        localStorage.setItem('email', email);
        this.email = email;
        this.persistSessionMetadata({ ...this.getStoredSession(), email });
    }

    getEmail(): string | null {
        return localStorage.getItem('email');
    }

    setNickName(nickName: string) {
        localStorage.setItem('nickName', nickName);
        this.nickName = nickName;
        this.persistSessionMetadata({ ...this.getStoredSession(), nickName });
    }

    getNickName(): string | null {
        return localStorage.getItem('nickName');
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
            branch: session.branch ?? current.branch ?? localStorage.getItem('branch'),
            fullName: session.fullName ?? current.fullName ?? localStorage.getItem('name'),
            image: session.image ?? current.image ?? localStorage.getItem('image'),
            id: session.id ?? current.id ?? localStorage.getItem('id'),
            rights: session.rights ?? current.rights ?? this.getRights(),
            email: session.email ?? current.email ?? localStorage.getItem('email'),
            nickName: session.nickName ?? current.nickName ?? localStorage.getItem('nickName'),
            accessTokenExpiresAt: session.accessTokenExpiresAt ?? current.accessTokenExpiresAt ?? this.accessTokenExpiresAt ?? null
        };

        localStorage.setItem(authStorageKey, JSON.stringify(nextSession));
        if (nextSession.branch) {
            localStorage.setItem('branch', nextSession.branch);
        }
        if (nextSession.fullName) {
            localStorage.setItem('name', nextSession.fullName);
        }
        if (nextSession.image) {
            localStorage.setItem('image', nextSession.image);
        }
        if (nextSession.id) {
            localStorage.setItem('id', nextSession.id);
        }
        if (nextSession.rights !== undefined && nextSession.rights !== null) {
            localStorage.setItem('rights', JSON.stringify(nextSession.rights));
        }
        if (nextSession.email) {
            localStorage.setItem('email', nextSession.email);
        }
        if (nextSession.nickName) {
            localStorage.setItem('nickName', nextSession.nickName);
        }

        this.accessSnapshotToPublicFields(nextSession);
    }

    private accessSnapshotToPublicFields(session: SessionSnapshot) {
        this.fullName = session.fullName ?? null;
        this.image = session.image ? `${environment.apiUrl}file/download?id=${session.image}` : null;
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

        keys.forEach((key) => localStorage.removeItem(key));
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
        const rawSession = localStorage.getItem(authStorageKey);
        if (!rawSession) {
            return {
                branch: localStorage.getItem('branch'),
                fullName: localStorage.getItem('name'),
                image: localStorage.getItem('image'),
                id: localStorage.getItem('id'),
                rights: this.getRights(),
                email: localStorage.getItem('email'),
                nickName: localStorage.getItem('nickName')
            };
        }

        try {
            const parsed = JSON.parse(rawSession) as Partial<SessionSnapshot>;
            return {
                branch: parsed.branch ?? localStorage.getItem('branch'),
                fullName: parsed.fullName ?? localStorage.getItem('name'),
                image: parsed.image ?? localStorage.getItem('image'),
                id: parsed.id ?? localStorage.getItem('id'),
                rights: parsed.rights ?? this.getRights(),
                email: parsed.email ?? localStorage.getItem('email'),
                nickName: parsed.nickName ?? localStorage.getItem('nickName'),
                accessTokenExpiresAt: parsed.accessTokenExpiresAt ?? null
            };
        } catch {
            return {
                branch: localStorage.getItem('branch'),
                fullName: localStorage.getItem('name'),
                image: localStorage.getItem('image'),
                id: localStorage.getItem('id'),
                rights: this.getRights(),
                email: localStorage.getItem('email'),
                nickName: localStorage.getItem('nickName')
            };
        }
    }

    private readLegacyAccessToken(): string | null {
        const bearerToken = localStorage.getItem(legacyAccessTokenKey);
        if (bearerToken) {
            return bearerToken;
        }

        const rawSession = localStorage.getItem(authStorageKey);
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
        localStorage.removeItem(legacyAccessTokenKey);
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
        return localStorage.getItem('image');
    }
}
