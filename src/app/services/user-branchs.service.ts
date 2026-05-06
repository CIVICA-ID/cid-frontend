import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '@/config.token';
// import { Address } from "../api/address";

@Injectable({
    providedIn: 'root'
})
export class UserBranchsService {
    private readonly appConfig = inject(APP_CONFIG);
    url: string = `${this.appConfig.apiUrl}user-branches`;
    constructor(private http: HttpClient) {}
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
