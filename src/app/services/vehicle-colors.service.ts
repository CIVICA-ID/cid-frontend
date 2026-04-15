import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { VehicleColors } from '@/api/vehicle-colors';

@Injectable({
    providedIn: 'root'
})
export class VehicleColorsService {
    url: string = `${environment.apiUrl}vehicle-colors`;
    constructor(private http: HttpClient) {}
    getList(): Observable<VehicleColors[]> {
        return this.http.get<VehicleColors[]>(this.url);
    }
}
