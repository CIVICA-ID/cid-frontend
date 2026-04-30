import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Auth } from '@/api/auth';
import { APP_CONFIG } from '@/config.token';
import { AuthLoginResponse, BranchOption, RefreshRequest, SKIP_AUTH_INTERCEPTOR } from './auth-session.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly appConfig = inject(APP_CONFIG);
    url: string = `${this.appConfig.apiUrl}auth`;
    constructor(private http: HttpClient) {}

    login(data: Auth): Observable<AuthLoginResponse> {
        return this.http.post<AuthLoginResponse>(`${this.url}/login`, data, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    getBranches(nickName: string): Observable<BranchOption[]> {
        return this.http.get<BranchOption[]>(`${this.url}/branches/${nickName}`, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    refresh(data: RefreshRequest): Observable<AuthLoginResponse> {
        return this.http.post<AuthLoginResponse>(`${this.url}/refresh`, data, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }

    logout(): Observable<{ ok: boolean }> {
        return this.http.post<{ ok: boolean }>(`${this.url}/logout`, {}, {
            context: new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true),
            withCredentials: true
        });
    }
}
