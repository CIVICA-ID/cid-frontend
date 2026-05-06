import { Injectable, inject } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { APP_CONFIG } from '@/config.token';
import { AdministrativeFaultsCategory } from '@/api/administrative-faults-category';

@Injectable({
    providedIn: 'root'
})
export class AdministrativeFaultsCategoryService {
    private readonly appConfig = inject(APP_CONFIG);
    url: string = `${this.appConfig.apiUrl}administrative_faults_category`;
    constructor(private http: HttpClient) {}
    getList(): Observable<AdministrativeFaultsCategory[]> {
        return this.http.get<AdministrativeFaultsCategory[]>(this.url);
    }
}
