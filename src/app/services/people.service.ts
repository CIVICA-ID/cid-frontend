import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { APP_CONFIG } from '@/config.token';

@Injectable({
  providedIn: 'root'
})
export class PeopleService {
    filters={
        "contains":"$ilike",
        "equals":"$eq",
        "startsWith":"$sw",
    }
    
  private readonly appConfig = inject(APP_CONFIG);
  url: string = `${this.appConfig.apiUrl}people`;
  constructor(private http: HttpClient) { }
  getList(limit:number,page:number,sort:any,search :any):Observable<any[]> 
    {
      const body = {
        "limit" :limit,
        "page": page,
        "sortBy":sort,
        "filter" : search,
      
      }
                       
      return this.http.post<any[]>(this.url+"/list", body);
  }



  create(data:any):Observable<Object>
  {
    return this.http.post(this.url,data);
  }
  getById(id:string)
  {
    return this.http.get<any>(this.url+"/"+id);
  }
  disable(id:string)
  {
    return this.http.delete(this.url+"/disable/"+id);
  }
  update(id:string,data:any)
  {
    return this.http.patch(this.url+"/"+id,data);
  }

  getPeople(page: number, search: any): Observable<any> {
        const options = {
            params: new HttpParams({
                fromString: "search=" + search + "&page=" + page
            })
        };

        return this.http.get<any>(this.url + "/search", options);
    }
}