import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FreedomTicket } from '@/api/freedom-ticket';

@Injectable({
  providedIn: 'root'
})
export class FreedomTicketsService {
  private readonly url = `${environment.apiUrl}freedom-tickets`;

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
    return this.http.post(this.url, data);
  }

  update(id: string, data: Partial<FreedomTicket>) {
    return this.http.put(`${this.url}/${id}`, data);
  }

  disable(id: string) {
    return this.http.put(`${this.url}/disable/${id}`, '');
  }

  getById(id: string) {
    return this.http.get<FreedomTicket>(`${this.url}/${id}`);
  }
}
