import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MedicalReport } from '@/api/medical-report';
import { serializeDateTimeFields } from '@/lib/date-time';

const MEDICAL_REPORT_DATE_FIELDS = ['dictation_date'] as const;

@Injectable({
  providedIn: 'root'
})
export class MedicalReportsService {
  private readonly url = `${environment.apiUrl}medical-reports`;

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

  getListSimple(): Observable<MedicalReport[]> {
    return this.http.get<MedicalReport[]>(this.url);
  }

  create(data: Partial<MedicalReport>) {
    return this.http.post(this.url, serializeDateTimeFields(data, MEDICAL_REPORT_DATE_FIELDS));
  }

  update(id: string, data: Partial<MedicalReport>) {
    return this.http.put(`${this.url}/${id}`, serializeDateTimeFields(data, MEDICAL_REPORT_DATE_FIELDS));
  }

  disable(id: string) {
    return this.http.put(`${this.url}/disable/${id}`, '');
  }

  getById(id: string) {
    return this.http.get<MedicalReport>(`${this.url}/${id}`);
  }
}
