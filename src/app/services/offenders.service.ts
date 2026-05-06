import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '@/config.token';
import { Offender } from '@/api/offender';


@Injectable({
  providedIn: 'root'
})
export class OffendersService {
    private readonly appConfig = inject(APP_CONFIG);
    url: string = `${this.appConfig.apiUrl}offenders`;
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

    create(data: any) {
        return this.http.post(this.url, data);
    }
    getById(id: string) {
        return this.http.get<Offender>(this.url + '/' + id);
    }
    disable(id: string) {
        return this.http.put(this.url + '/disable/' + id, '');
    }
    update(id: string, data: any) {
        return this.http.put(this.url + '/' + id, data);
    }
}
