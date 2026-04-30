import { Injectable, inject } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { APP_CONFIG } from '@/config.token';
import { VehicleSubBrand } from '@/api/vehicle-subbrand';

@Injectable({
    providedIn: 'root'
})
export class VehicleSubBrandsService {
    private readonly appConfig = inject(APP_CONFIG);
    url: string = `${this.appConfig.apiUrl}vehicle-subbrands`;
    constructor(private http: HttpClient) {}
    getList(): Observable<VehicleSubBrand[]> {
        return this.http.get<VehicleSubBrand[]>(this.url);
    }
}
