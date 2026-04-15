import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PsychosocialReport } from '@/api/psychosocial-report';
import { serializeDateTimeFields } from '@/lib/date-time';

const PSYCHOSOCIAL_REPORT_DATE_FIELDS = ['dictation_date'] as const;

@Injectable({
  providedIn: 'root'
})
export class PsychosocialReportsService {
  private readonly url = `${environment.apiUrl}psychosocial-reports`;

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

  create(data: Partial<PsychosocialReport>) {
    return this.http.post(this.url, serializeDateTimeFields(data, PSYCHOSOCIAL_REPORT_DATE_FIELDS));
  }

  update(id: string, data: Partial<PsychosocialReport>) {
    return this.http.put(`${this.url}/${id}`, serializeDateTimeFields(data, PSYCHOSOCIAL_REPORT_DATE_FIELDS));
  }

  disable(id: string) {
    return this.http.put(`${this.url}/disable/${id}`, '');
  }

  getById(id: string) {
    return this.http.get<PsychosocialReport>(`${this.url}/${id}`);
  }
}
