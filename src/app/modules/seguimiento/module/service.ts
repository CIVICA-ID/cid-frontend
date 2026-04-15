import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Seguimiento } from '@/api/seguimiento';
import { serializeDateTimeFields } from '@/lib/date-time';

const SEGUIMIENTO_DATE_FIELDS = ['followDate'] as const;

@Injectable({
  providedIn: 'root'
})
export class SeguimientoService {
  private readonly url = `${environment.apiUrl}tracings`;

  constructor(private http: HttpClient) {}

  getList(limit: number, page: number, sort: string[][], search: any): Observable<any> {
    const body = {
      limit,
      page,
      sortBy: sort,
      filter: search
    };
    return this.http.post<any>(`${this.url}/list`, body);
  }

  create(data: Partial<Seguimiento>) {
    return this.http.post(this.url, serializeDateTimeFields(data, SEGUIMIENTO_DATE_FIELDS));
  }

  update(id: string, data: Partial<Seguimiento>) {
    return this.http.put(`${this.url}/${id}`, serializeDateTimeFields(data, SEGUIMIENTO_DATE_FIELDS));
  }

  disable(id: string) {
    return this.http.put(`${this.url}/disable/${id}`, '');
  }

  getById(id: string) {
    return this.http.get<Seguimiento>(`${this.url}/${id}`);
  }
}
