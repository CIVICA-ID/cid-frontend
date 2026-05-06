import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from "rxjs";
import { APP_CONFIG } from '@/config.token';

@Injectable({
    providedIn: 'root'
})
export class VehiclesService {
    private readonly appConfig = inject(APP_CONFIG);
    url: string = `${this.appConfig.apiUrl}vehicles`;
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
    create(address: any): Observable<Object> {
        return this.http.post(this.url, address);
    }
    getById(id:string)
    {
        return this.http.get<any>(this.url+"/"+id);
    }
    //   disable(id:string)
    //   {
    //     return this.http.delete(this.url+"/disable/"+id);
    //   }
    //   update(id:string,address:any)
    //   {
    //     return this.http.patch(this.url+"/"+id,address);
    //   }
}
