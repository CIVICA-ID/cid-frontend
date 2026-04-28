import { TenFingerCapture } from "@/components/people/models";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { catchError, finalize, Observable, tap, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { BaseApiService } from "./base-api.service";

// Tipos de dedos
export type SearchFingerType =
| 'leftThumb' | 'leftIndex' | 'leftMiddle' | 'leftRing' | 'leftLittle'
| 'rightThumb' | 'rightIndex' | 'rightMiddle' | 'rightRing' | 'rightLittle';
// Interfaces
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
    peopleAddresses?: any[];
    fingers: TenFingerCapture;
}

@Injectable({ providedIn: 'root'})
export class FingerprintService extends BaseApiService{
    private apiUrl = `${environment.apiUrl}fingerprint`;

    constructor(private http: HttpClient){
        super();
    }

    searchFingerprint(request: SearchRequest): Observable<MatchResult>{
        return this.executeRequest(
            this.http.post<MatchResult>(`${this.apiUrl}/search`, request).pipe(
                tap(result => {
                    console.log('Busqueda completada', result)
                })
            )
        );
    }

    confirmMatch(request: ConfirmationRequest): Observable<MatchResult>{
        return this.executeRequest(
            this.http.post<MatchResult>(`${this.apiUrl}/confirm`, request).pipe(
                tap(result => {
                    console.log('Confirmacion procesada', result)
                })
            )
        );
    }

    enrollFingerprint(request: EnrollFingerprintRequest): Observable<any>{
        return this.executeRequest(
            this.http.post(`${this.apiUrl}/enroll`, request).pipe(
                tap(() => {
                    console.log('Huellas enroladas correctamente')
                })
            )
        );
    }

    protected override extractErrorMessage(error: HttpErrorResponse): string{
        return super.extractErrorMessage(error, {
            503: 'Servicio ocupado, intente mas tarde'
        });
    }
}
