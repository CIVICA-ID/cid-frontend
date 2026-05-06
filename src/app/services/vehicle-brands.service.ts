import { Injectable, inject } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { APP_CONFIG } from '@/config.token';
import { VehicleBrand } from '@/api/vehicle-brand';

@Injectable({
    providedIn: 'root'
})
export class VehicleBrandsService {
    private readonly appConfig = inject(APP_CONFIG);
    url: string = `${this.appConfig.apiUrl}vehicle-brands`;
    constructor(private http: HttpClient) {}
    getList(): Observable<VehicleBrand[]> {
        return this.http.get<VehicleBrand[]>(this.url);
    }
}
