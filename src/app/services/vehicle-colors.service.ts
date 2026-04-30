import { Injectable, inject } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { APP_CONFIG } from '@/config.token';
import { VehicleColors } from '@/api/vehicle-colors';

@Injectable({
    providedIn: 'root'
})
export class VehicleColorsService {
    private readonly appConfig = inject(APP_CONFIG);
    url: string = `${this.appConfig.apiUrl}vehicle-colors`;
    constructor(private http: HttpClient) {}
    getList(): Observable<VehicleColors[]> {
        return this.http.get<VehicleColors[]>(this.url);
    }
}
