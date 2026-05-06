import { Injectable, inject } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { APP_CONFIG } from '@/config.token';
import { AdministrativeFaults } from '@/api/administrative-faults';
import { AdministrativeFaultsCategory } from '@/api/administrative-faults-category';

@Injectable({
    providedIn: 'root'
})
export class AdministrativeFaultsService {
    private readonly appConfig = inject(APP_CONFIG);
    url: string = `${this.appConfig.apiUrl}administrative_faults`;
    constructor(private http: HttpClient) {}
    getList(): Observable<AdministrativeFaults[]> {
        return this.http.get<AdministrativeFaults[]>(this.url);
    }
    getCategorysById(id: string) {
        return this.http.get<AdministrativeFaults[]>(`${this.url}/${id}`);
    }
    getById(id: string):Observable<AdministrativeFaults> {
        return this.http.get<AdministrativeFaults>(`${this.url}/GetById/${id}`);
    }
}
