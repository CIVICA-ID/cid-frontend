import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '@/config.token';
import { CellStay } from '@/api/cell-stay';
import { serializeDateTimeFields } from '@/lib/date-time';

const CELL_STAY_DATE_FIELDS = ['entryDate'] as const;

@Injectable({
  providedIn: 'root'
})
export class CellStaysService {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly url = `${this.appConfig.apiUrl}cell-stays`;

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

  getListSimple(): Observable<CellStay[]> {
    return this.http.get<CellStay[]>(this.url);
  }

  create(data: Partial<CellStay>) {
    return this.http.post(this.url, serializeDateTimeFields(data, CELL_STAY_DATE_FIELDS));
  }

  update(id: string, data: Partial<CellStay>) {
    return this.http.put(`${this.url}/${id}`, serializeDateTimeFields(data, CELL_STAY_DATE_FIELDS));
  }

  disable(id: string) {
    return this.http.put(`${this.url}/disable/${id}`, '');
  }

  getById(id: string) {
    return this.http.get<CellStay>(`${this.url}/${id}`);
  }
}
