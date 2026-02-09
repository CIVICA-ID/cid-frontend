import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MedicalArea } from '@/api/medical-area';

@Injectable({
    providedIn: 'root'
})
export class MedicalAreaService {
    url: string = `${environment.apiUrl}medical-areas`;
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

    getListSimple(): Observable<MedicalArea[]> {
        return this.http.get<MedicalArea[]>(this.url);
    }

    create(data: MedicalArea) {
        return this.http.post(this.url, data);
    }

    getById(id: string) {
        return this.http.get<any>(this.url + '/' + id);
    }

    disable(id: string) {
        return this.http.delete(this.url + '/disable/' + id);
    }

    update(id: string, data: MedicalArea) {
        return this.http.put(this.url + '/' + id, data);
    }
}
