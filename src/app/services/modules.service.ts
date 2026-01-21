import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Module } from '@/api/module';

@Injectable({
    providedIn: 'root'
})
export class ModulesServices {
    url: string = `${environment.apiUrl}modules`;
    constructor(private http: HttpClient) {}
    getList(limit: number, page: number, sort: string[][], search: any): Observable<any> {
        const body = {
            limit: limit,
            page: page,
            sortBy: sort,
            filter: search
        };
        return this.http.post<any>(this.url + '/list', body);
    }
    getListSimple(): Observable<Module[]> {
        return this.http.get<Module[]>(this.url);
    }

    create(data: any) {
        return this.http.post(this.url, data);
    }
    getById(id: string) {
        return this.http.get<any>(this.url + '/' + id);
    }
    disable(id: string) {
        return this.http.put(this.url + '/disable/' + id, '');
    }
    update(id: string, data: any) {
        return this.http.put(this.url + '/' + id, data);
    }
}
