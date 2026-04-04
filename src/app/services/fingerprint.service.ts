import { TenFingerCapture } from "@/components/people/people.component";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { catchError, finalize, Observable, tap, throwError } from "rxjs";
import { environment } from "src/environments/environment";


export type SearchFingerType =
| 'leftThumb' | 'leftIndex' | 'leftMiddle' | 'leftRing' | 'leftLittle'
| 'rightThumb' | 'rightIndex' | 'rightMiddle' | 'rightRing' | 'rightLittle';

export interface MatchResult {
    isMatch: boolean;
    peopleId?: string;
    firstName?: string;
    paternalName?: string;
    maternalName?: string;
    curp?: string;
    score: number;
    requiresConfirmation?: boolean;
    sessionId?: string;
    processedRecords?: number;
    totalRecords?: number;
    elapsedMs?: number;
}

export interface SearchRequest {
    fingerprintImage: string;
    threshold?: number;
    highConfidenceThreshold?: number;
    sessionId?: string;
    fingerType: SearchFingerType;
}

export interface ConfirmationRequest{
    sessionId: string;
    isCorrect: boolean;
}

export interface EnrollFingerprintRequest {
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
    peopleAddress?: any[];
    fingers: TenFingerCapture;
}

@Injectable({ providedIn: 'root'})
export class FingerprintService{
    private apiUrl = `${environment.apiUrl}fingerprint`;

    loading = signal<boolean>(false);
    lastError = signal<string | null>(null);

    constructor(private http: HttpClient){}

    clearError(): void{
        this.lastError.set(null);
    }

    searchFingerprint(request: SearchRequest): Observable<MatchResult>{
        this.loading.set(true);
        this.clearError();

        return this.http.post<MatchResult>(`${this.apiUrl}/search`, request).pipe(
            tap((result) => console.log('Busqueda completada', result)),
            catchError((error) => this.handleError(error, 'Error durante la busqueda')),
            finalize(() => this.loading.set(false))
        );
    }

    confirmMatch(request: ConfirmationRequest): Observable<MatchResult>{
        this.loading.set(true);
        this.clearError();

        return this.http.post<MatchResult>(`${this.apiUrl}/confirm`, request).pipe(
            tap((result) => console.log('Confirmacion procesada', result)),
            catchError((error) => this.handleError(error, 'Error al procesar confirmacion')),
            finalize(() => this.loading.set(false))
        );
    }

    enrollFingerprint(request: EnrollFingerprintRequest): Observable<any>{
        this.loading.set(true);
        this.clearError();

        return this.http.post(`${this.apiUrl}/enroll`, request).pipe(
            tap(() => console.log('Huellas enroladas correctamente')),
            catchError((error) => this.handleError(error, 'Error en enrolamiento')),
            finalize(() => this.loading.set(false))
        );
    }

    private handleError(error: HttpErrorResponse, defaultMessage: string)
    {
        let errorMessage = defaultMessage;
        if(error.error instanceof ErrorEvent){
            errorMessage = `Error de red: ${error.error.message}`;
        } else {
            switch(error.status){
                case 0:
                    errorMessage = 'No se puede conectar con el servidor';
                    break;
                case 400:
                    errorMessage = error.error?.message || 'Solicitud invalida';
                    break;
                case 503:
                    errorMessage = error.error?.message || 'Servicio ocupado, intente mas tarde';
                    break;
                default:
                    errorMessage = error.error?.message || error.message || defaultMessage;
            }
        }
        this.lastError.set(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}
