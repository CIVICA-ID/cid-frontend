import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
// import { Address } from "../api/address";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    url: string = `${environment.apiUrl}users`;
    constructor(private http: HttpClient) {}
    getUser(userName: string): Observable<Object> {
        const params=new HttpParams().set('nickName', userName);
        return this.http.post(this.url+"/getByNickName",params);
    }
    getList(limit: number, page: number, sort: string[][], search: any): Observable<any> {
        const body = {
            limit: limit,
            page: page,
            sortBy: sort,
            filter: search
        };
        return this.http.post<any>(this.url + '/list', body);
    }
    create(data: any) {
        return this.http.post(this.url, data);
    }
    getById(id: string) {
        return this.http.get<any>(this.url + '/' + id);
    }
    disable(id: string) {
        return this.http.put(this.url + '/disable/' + id, '');
    }
    update(id: string, data: any) {
        return this.http.patch(this.url + '/' + id, data);
    }
}
