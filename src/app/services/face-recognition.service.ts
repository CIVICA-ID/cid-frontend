import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface FaceSearchResult {
    isMatch: boolean;
    peopleId?: string;
    firstName?: string;
    paternalName?: string;
    maternalName?: string;
    curp?: string;
    similarity?: number;
    threshold?: number;
}

export interface FaceSearchRequest {
    imageBase64: string;
}

export interface EnrollFaceRequest {
    firstName?: string;
    paternalName?: string;
    maternalName?: string;
    curp?: string;
    gender?: string;
    maritalStatus?: string;
    educationLevel?: string;
    occupation?: string;
    alias?: string;
    birthDate?: Date;
    peopleAddresses?: any[];
    imageFront: string;
    imageLeftProfile?: string;
    imageRightProfile?: string;
}

export interface SavePhotosRequest {
    peopleId: string;
    imageFront: string;
    imageLeftProfile?: string;
    imageRightProfile?: string;
}

@Injectable({ providedIn: 'root' })
export class FaceRecognitionService {
    private readonly apiUrl = `${environment.apiUrl}people-photos`;

    loading = signal(false);
    lastError = signal<string | null>(null);

    constructor(private readonly http: HttpClient) { }

    clearError(): void {
        this.lastError.set(null);
    }

    searchByFace(request: FaceSearchRequest): Observable<FaceSearchResult> {
        return this.request<FaceSearchResult>('post', '/search-face', request);
    }

    enrollWithFace(request: EnrollFaceRequest): Observable<any> {
        return this.request('post', '/enroll-face', request);
    }

    savePhotosForPerson(request: SavePhotosRequest): Observable<any> {
        return this.request('post', '/save-photos', request);
    }

    private request<T>(method: 'post', path: string, body: any): Observable<T> {
        this.loading.set(true);
        this.clearError();

        return this.http.post<T>(`${this.apiUrl}${path}`, body).pipe(
            catchError((error: HttpErrorResponse) => {
                const message = this.extractErrorMessage(error);
                this.lastError.set(message);
                return throwError(() => new Error(message));
            }),
            finalize(() => this.loading.set(false)),
        );
    }

    private extractErrorMessage(error: HttpErrorResponse): string {
        if (error.error instanceof ErrorEvent) {
            return `Error de red: ${error.error.message}`;
        }

        const serverMessage = error.error?.message;

        switch (error.status) {
            case 0: return 'No se puede conectar con el servidor';
            case 400: return serverMessage || 'Solicitud inválida';
            case 500: return serverMessage || 'Error interno del servidor';
            default: return serverMessage || error.message || 'Error desconocido';
        }
    }
}
