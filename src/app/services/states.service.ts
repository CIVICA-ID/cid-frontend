import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { State } from "@/api/state";

@Injectable({
    providedIn: 'root'
})
export class StateService {
    url: string = `${environment.apiUrl}states`;
    constructor(private http: HttpClient) { }
    getList(): Observable<State[]> {
        return this.http.get<State[]>(this.url );
    }
}