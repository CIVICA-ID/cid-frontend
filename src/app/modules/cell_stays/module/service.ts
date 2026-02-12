import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CellStay } from '@/api/cell-stay';

@Injectable({
  providedIn: 'root'
})
export class CellStaysService {
  private readonly url = `${environment.apiUrl}cell-stays`;

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
    return this.http.post(this.url, data);
  }

  update(id: string, data: Partial<CellStay>) {
    return this.http.put(`${this.url}/${id}`, data);
  }

  disable(id: string) {
    return this.http.put(`${this.url}/disable/${id}`, '');
  }

  getById(id: string) {
    return this.http.get<CellStay>(`${this.url}/${id}`);
  }
}
