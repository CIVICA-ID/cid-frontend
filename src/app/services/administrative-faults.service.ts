import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { AdministrativeFaults } from '@/api/administrative-faults';
import { AdministrativeFaultsCategory } from '@/api/administrative-faults-category';

@Injectable({
    providedIn: 'root'
})
export class AdministrativeFaultsService {
    url: string = `${environment.apiUrl}administrative_faults`;
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
