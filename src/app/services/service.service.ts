import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable, firstValueFrom } from "rxjs";
import { environment } from "@env/environment";
import { SessionService } from '@/services/session.service';

export interface ApiResponse<T> {
  success: number;
  data: T;
}

export type HttpMethod = "formdata" | "post" | "get" | "delete" | "patch";

@Injectable({
  providedIn: "root"
})
export class ServiceService {
  private readonly httpClient = inject(HttpClient);
  private readonly sessionService = inject(SessionService);
  private readonly baseUrl = environment.apiUrl;

  private getHeaders(includeContentType = true): HttpHeaders {
    const token = this.sessionService.getAccessToken();
    const headers: Record<string, string> = {
      'raw': 'true'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return new HttpHeaders(headers);
  }

  private buildParams(params: object): HttpParams {
    let httpParams = new HttpParams();
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return httpParams;
  }

  async fetch<T>(
    data: object | null,
    url: string,
    method: HttpMethod,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    const list = options?.list ?? true;
    const fullPath = options?.full_path ?? false;

    const request$ = this.createRequest<T>(data, url, method, list, fullPath);
    const response = await firstValueFrom(request$);

    return { success: 1, data: response };
  }

  private createRequest<T>(
    data: object | null,
    url: string,
    method: HttpMethod,
    list: boolean,
    fullPath: boolean
  ): Observable<T> {
    const finalUrl = fullPath ? url : `${this.baseUrl}${url}`;

    switch (method) {
      case "post":
        return this.httpClient.post<T>(finalUrl, data, { headers: this.getHeaders() });

      case "get":
        return this.executeGet<T>(data, url, list, fullPath);

      case "patch":
        return this.httpClient.patch<T>(finalUrl, data, { headers: this.getHeaders() });

      case "delete":
        return this.httpClient.delete<T>(finalUrl, { headers: this.getHeaders() });

      case "formdata":
        const formData = this.createFormData(data);
        return this.httpClient.post<T>(finalUrl, formData, { headers: this.getHeaders(false) });

      default:
        throw new Error(`Método HTTP no soportado: ${method}`);
    }
  }

  private executeGet<T>(
    params: object | null,
    url: string,
    list: boolean,
    fullPath: boolean
  ): Observable<T> {
    if (fullPath) {
      return this.httpClient.get<T>(url, {
        headers: this.getHeaders(),
        params: this.buildParams(params ?? {})
      });
    }

    if (list) {
      return this.httpClient.get<T>(`${this.baseUrl}${url}`, {
        headers: this.getHeaders(),
        params: this.buildParams(params ?? {})
      });
    }

    return this.httpClient.get<T>(`${this.baseUrl}${url}/${params}`, {
      headers: this.getHeaders()
    });
  }

  private createFormData(data: object | null): FormData {
    const formData = new FormData();
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof Blob) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      });
    }
    return formData;
  }

  async downloadFile(
    data: object | null,
    url: string,
    method: "post" | "get" = "post"
  ): Promise<Blob> {
    const token = this.sessionService.getAccessToken();
    const headerValues: Record<string, string> = {};
    if (token) {
      headerValues['Authorization'] = `Bearer ${token}`;
    }
    const headers = new HttpHeaders(headerValues);

    const finalUrl = `${this.baseUrl}${url}`;

    const request$ = method === "post"
      ? this.httpClient.post(finalUrl, data, { headers, responseType: 'blob' })
      : this.httpClient.get(finalUrl, {
          headers,
          params: this.buildParams(data ?? {}),
          responseType: 'blob'
        });

    return firstValueFrom(request$);
  }
}
