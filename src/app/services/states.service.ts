import { Injectable, inject } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { APP_CONFIG } from '@/config.token';
import { State } from "@/api/state";

@Injectable({
    providedIn: 'root'
})
export class StateService {
    private readonly appConfig = inject(APP_CONFIG);
    url: string = `${this.appConfig.apiUrl}states`;
    constructor(private http: HttpClient) { }
    getList(): Observable<State[]> {
        return this.http.get<State[]>(this.url );
    }
}
