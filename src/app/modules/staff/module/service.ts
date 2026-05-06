import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '@/config.token';
import { Staff } from '@/api/staff';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly url = `${this.appConfig.apiUrl}staff`;

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

  getListSimple(): Observable<Staff[]> {
    return this.http.get<Staff[]>(this.url);
  }

  create(data: Partial<Staff>) {
    return this.http.post(this.url, data);
  }

  update(id: string, data: Partial<Staff>) {
    return this.http.put(`${this.url}/${id}`, data);
  }

  disable(id: string) {
    return this.http.put(`${this.url}/disable/${id}`, '');
  }

  getById(id: string) {
    return this.http.get<Staff>(`${this.url}/${id}`);
  }
}
