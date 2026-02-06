import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { AdministrativeFaultsCategory } from '@/api/administrative-faults-category';

@Injectable({
    providedIn: 'root'
})
export class AdministrativeFaultsCategoryService {
    url: string = `${environment.apiUrl}administrative_faults_category`;
    constructor(private http: HttpClient) {}
    getList(): Observable<AdministrativeFaultsCategory[]> {
        return this.http.get<AdministrativeFaultsCategory[]>(this.url);
    }
}
