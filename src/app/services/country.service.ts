import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable, of } from "rxjs";
import { environment } from "src/environments/environment";
import { State } from "@/api/state";
import { Country } from "@/api/country";

@Injectable({
    providedIn: 'root'
})
export class CountriesService {
    url: string = `${environment.apiUrl}countries`;
    constructor(private http: HttpClient) { }
    getList(): Observable<Country[]> {
        return this.http.get<Country[]>(this.url );
    }
}