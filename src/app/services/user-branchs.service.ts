import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
// import { Address } from "../api/address";

@Injectable({
    providedIn: 'root'
})
export class UserBranchsService {
    url: string = `${environment.apiUrl}user-branches`;
    constructor(private http: HttpClient) {}
    getUserBranches(userId: string): Observable<Object> {
        return this.http.get(this.url + '/getByUserId/' + userId);
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
