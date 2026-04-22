import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Auth } from '@/api/auth';
import { AuthLoginResponse, RefreshRequest, SKIP_AUTH_INTERCEPTOR } from './auth-session.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    url: string = `${environment.apiUrl}auth`;
    constructor(private http: HttpClient) {}

    login(data: Auth): Observable<AuthLoginResponse> {
        return this.http.post<AuthLoginResponse>(`${this.url}/login`, data, {
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
