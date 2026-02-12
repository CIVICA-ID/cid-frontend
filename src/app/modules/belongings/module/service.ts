import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Belonging } from '@/api/belonging';

@Injectable({
  providedIn: 'root'
})
export class BelongingsService {
  private readonly url = `${environment.apiUrl}belongings`;

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

  getListSimple(): Observable<Belonging[]> {
    return this.http.get<Belonging[]>(this.url);
  }

  create(data: Partial<Belonging>) {
    return this.http.post(this.url, data);
  }

  update(id: string, data: Partial<Belonging>) {
    return this.http.put(`${this.url}/${id}`, data);
  }

  disable(id: string) {
    return this.http.put(`${this.url}/disable/${id}`, '');
  }

  getById(id: string) {
    return this.http.get<Belonging>(`${this.url}/${id}`);
  }
}
