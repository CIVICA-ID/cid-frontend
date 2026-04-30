import { Injectable, inject } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable, of } from "rxjs";
import { APP_CONFIG } from '@/config.token';
import { State } from "@/api/state";
import { Country } from "@/api/country";

@Injectable({
    providedIn: 'root'
})
export class CountriesService {
    private readonly appConfig = inject(APP_CONFIG);
    url: string = `${this.appConfig.apiUrl}countries`;
    constructor(private http: HttpClient) { }
    getList(): Observable<Country[]> {
        return this.http.get<Country[]>(this.url );
    }
}