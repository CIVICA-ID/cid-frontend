import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { VehicleSubBrand } from '@/api/vehicle-subbrand';

@Injectable({
    providedIn: 'root'
})
export class VehicleSubBrandsService {
    url: string = `${environment.apiUrl}vehicle-subbrands`;
    constructor(private http: HttpClient) {}
    getList(): Observable<VehicleSubBrand[]> {
        return this.http.get<VehicleSubBrand[]>(this.url);
    }
}
