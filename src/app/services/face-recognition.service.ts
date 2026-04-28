import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseApiService } from './base-api.service';

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
export class FaceRecognitionService extends BaseApiService {
    private readonly apiUrl = `${environment.apiUrl}people-photos`;

    constructor(private readonly http: HttpClient) {
        super();
    }

    searchByFace(request: FaceSearchRequest): Observable<FaceSearchResult> {
        return this.executeRequest(
            this.http.post<FaceSearchResult>(`${this.apiUrl}/search-face`, request)
        );
    }

    enrollWithFace(request: EnrollFaceRequest): Observable<any> {
        return this.executeRequest(
            this.http.post(`${this.apiUrl}/enroll-face`, request)
        );
    }

    savePhotosForPerson(request: SavePhotosRequest): Observable<any> {
        return this.executeRequest(
            this.http.post(`${this.apiUrl}/save-photos`, request)
        );
    }
}
