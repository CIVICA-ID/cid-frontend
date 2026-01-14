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
    // getAddresses(search: string) {
    //     return this.http.get<Address>(this.url + "/" + search);
    // }
    //   disable(id:string)
    //   {
    //     return this.http.delete(this.url+"/disable/"+id);
    //   }
    //   update(id:string,address:any)
    //   {
    //     return this.http.patch(this.url+"/"+id,address);
    //   }
}
