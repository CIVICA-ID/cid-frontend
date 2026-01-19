import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Role } from '@/api/rol';
// import { Address } from "../api/address";

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    url: string = `${environment.apiUrl}roles`;
    constructor(private http: HttpClient) {}
    getList(limit: number, page: number, sort: any, search: any): Observable<Role[]> {
        const body = {
            limit: limit,
            page: page,
            sortBy: sort,
            filter: search
        };
        return this.http.post<Role[]>(this.url + '/list', body);
    }
    create(data: Role): Observable<Object> {
        return this.http.post(this.url, data);
    }
    disable(id: string): Observable<Object> {
        return this.http.delete(this.url + '/disable/' + id);
    }
    update(id: string, address: any) {
        return this.http.put(this.url + '/' + id, address);
    }
    getById(id: string) {
        return this.http.get<any>(this.url + '/' + id);
    }
}
