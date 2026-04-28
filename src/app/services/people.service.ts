import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';
import { environment } from "src/environments/environment";
import { ApiResponse, PaginatedResponse, People } from "@/api/people";

interface ListRequest{
    limit: number;
    page: number;
    sortBy: [[string, string]];
    filter: Record<string, string>
}

@Injectable({
  providedIn: 'root'
})
export class PeopleService {
    private readonly url: string = `${environment.apiUrl}people`;
    readonly filters={
        contains: "$ilike",
        equals: "$eq",
        startsWith: "$sw",
    } as const;

  constructor(private readonly http: HttpClient) { }

  getList(limit:number,page:number,sort:[[string, string]],search: Record<string, string>):Observable<PaginatedResponse<People>>
    {
      const body: ListRequest = {
        limit,
        page,
        "sortBy":sort,
        "filter" : search,
      };

      return this.http.post<PaginatedResponse<People>>(this.url+"/list", body);
  }

  create(data: Partial<People>): Observable<ApiResponse<People>>
  {
    return this.http.post<ApiResponse<People>>(this.url, data);
  }
  getById(id: string): Observable<People>
  {
    return this.http.get<People>(this.url+"/"+id);
  }
  disable(id: string): Observable<void>
  {
    return this.http.delete<void>(this.url+"/disable/"+id);
  }
  update(id: string,data: Partial<People>): Observable<ApiResponse<People>>
  {
    return this.http.patch<ApiResponse<People>>(this.url+"/"+id, data);
  }

  getPeople(page: number, search: string): Observable<PaginatedResponse<People>> {
    const params = new HttpParams()
        .set('search', search)
        .set('page', page.toString());

    return this.http.get<PaginatedResponse<People>>(this.url + "/search", {params});
    }
}
