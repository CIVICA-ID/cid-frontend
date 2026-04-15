import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Auth } from '@/api/auth';
// import { Address } from "../api/address";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    url: string = `${environment.apiUrl}auth`;
    constructor(private http: HttpClient) {}
    login(data: Auth): Observable<Object> {
        return this.http.post(this.url+"/login", data);
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
