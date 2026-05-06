import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '@/config.token';
import { FreedomTicket } from '@/api/freedom-ticket';
import { serializeDateTimeFields } from '@/lib/date-time';

const FREEDOM_TICKET_DATE_FIELDS = ['releaseDate'] as const;

@Injectable({
  providedIn: 'root'
})
export class FreedomTicketsService {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly url = `${this.appConfig.apiUrl}freedom-tickets`;

  constructor(private http: HttpClient) {}

  getList(limit: number, page: number, sort: string[][], search: any): Observable<any> {
    const body = {
      limit: limit,
      page: page,
      sortBy: sort,
      filter: search
    };
    return this.http.post<any>(`${this.url}/list`, body);
  }

  getListSimple(): Observable<FreedomTicket[]> {
    return this.http.get<FreedomTicket[]>(this.url);
  }

  create(data: Partial<FreedomTicket>) {
    return this.http.post(this.url, serializeDateTimeFields(data, FREEDOM_TICKET_DATE_FIELDS));
  }

  update(id: string, data: Partial<FreedomTicket>) {
    return this.http.put(`${this.url}/${id}`, serializeDateTimeFields(data, FREEDOM_TICKET_DATE_FIELDS));
  }

  disable(id: string) {
    return this.http.put(`${this.url}/disable/${id}`, '');
  }

  getById(id: string) {
    return this.http.get<FreedomTicket>(`${this.url}/${id}`);
  }
}
