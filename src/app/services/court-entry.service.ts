import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '@/config.token';
import { serializeDateTimeFields } from '@/lib/date-time';

const COURT_ENTRY_DATE_FIELDS = ['entryDate'] as const;

@Injectable({
    providedIn: 'root'
})
export class CourtEntryService {
    private readonly appConfig = inject(APP_CONFIG);
    url: string = `${this.appConfig.apiUrl}court-entries`;
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
        return this.http.post(this.url, serializeDateTimeFields(data, COURT_ENTRY_DATE_FIELDS));
    }
    getById(id: string) {
        return this.http.get<any>(this.url + '/' + id);
    }
    disable(id: string) {
        return this.http.put(this.url + '/disable/' + id, '');
    }
    update(id: string, data: any) {
        return this.http.patch(this.url + '/' + id, serializeDateTimeFields(data, COURT_ENTRY_DATE_FIELDS));
    }
}
