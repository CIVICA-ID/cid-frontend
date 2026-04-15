import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { VehicleBrand } from '@/api/vehicle-brand';

@Injectable({
    providedIn: 'root'
})
export class VehicleBrandsService {
    url: string = `${environment.apiUrl}vehicle-brands`;
    constructor(private http: HttpClient) {}
    getList(): Observable<VehicleBrand[]> {
        return this.http.get<VehicleBrand[]>(this.url);
    }
}
