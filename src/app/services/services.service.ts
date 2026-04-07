import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { serializeDateTimeFields } from '@/lib/date-time';

const SERVICE_DATE_FIELDS = ['captureDate', 'serviceDate', 'dateReception', 'arrivalDate', 'endDate', 'arrestDate', 'submissionDate'] as const;

@Injectable({
    providedIn: 'root'
})
export class ServicesService {
    url: string = `${environment.apiUrl}services`;
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
        return this.http.post(this.url, serializeDateTimeFields(data, SERVICE_DATE_FIELDS));
    }
    getById(id: string) {
        return this.http.get<any>(this.url + '/' + id);
    }
    disable(id: string) {
        return this.http.put(this.url + '/disable/' + id, '');
    }
    update(id: string, data: any) {
        return this.http.put(this.url + '/' + id, serializeDateTimeFields(data, SERVICE_DATE_FIELDS));
    }
}
