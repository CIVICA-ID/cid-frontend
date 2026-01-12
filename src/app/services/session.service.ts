import { Injectable } from '@angular/core';
import { HttpClient , HttpParams } from "@angular/common/http";
import { environment } from '../../environments/environment';

const baseUrl:string = `${environment.apiUrl}/auth`;

@Injectable({
  providedIn: 'root' // 'Type<any> | "root" | "platform" | "any" | null'.
})
export class SessionService
{

  public bearer:string = "bearer";
  public fullName:string;
  public image:string;
  public id:string;//ya que lo requiere como cadena para guardarlo en el modelo
  public rights:any;
  public branch: string;
  public email: string;
   public nickName: string;

  constructor(private http: HttpClient)
  {
    this.fullName = this.getFullName();
    this.image = this.getImage();
    this.id = this.getId();
    this.rights = this.getRights();
    this.branch = this.getBranch();
    this.email = this.getEmail();
    this.nickName = this.getNickName();
  
  }

  register(user: any)
  {
	  return this.http.post(`${baseUrl}/register`, user);
  }

  verification(token:string)
  {
	  let params = new HttpParams().set('token', token);
	  return this.http.get(`${baseUrl}/confirm`, { params: params });
  }

  login(user: any)
  {
    return this.http.post(`${baseUrl}/login/`, user);
  }

  logout()
  {
	localStorage.clear(); //sessionStorage  Local storage: One of the best ways to store data. Local storage is not vulnerable to CSRF attacks.
	//delete from white list
  }

  forgotPassword(email:any)
  {
      return this.http.post(`${baseUrl}/forgot-password`, email);
  }

  resetPassword(data:any)
  {
      return this.http.post(`${baseUrl}/reset-password`, data);
  }

  validateTokenReset(data:any)
  {
      return this.http.post(`${baseUrl}/validate-token-reset`, data);
  }


  setToken(token: string)
  {
	localStorage.setItem(this.bearer, token);
  }

  getToken():string |null
  {
	  return localStorage.getItem(this.bearer);
  }
  getBranches(nickName : string){
    return  this.http.get(`${baseUrl}/branches/` +nickName);;
  }

  //-------------------------------------------------------

  setFullName(name:string)
  {
	  localStorage.setItem('name',name);
  }
  getFullName():string |null
  {
	  return localStorage.getItem('name');
  }

  setImage(uimage:string)
  {
	  localStorage.setItem('image',uimage);
  }
  getImage():string |null
  {
	  return `${environment.apiUrl}/file/download?id=`+localStorage.getItem('image');
  }

  setId(id:string)
  {
	  localStorage.setItem('id',id);
  }
  getId():string |null
  {
	  return localStorage.getItem('id');
  }

  setRights(rights:any)
  {
	  localStorage.setItem('rights',JSON.stringify(rights));
  }
  getRights():any |null
  {
	  return JSON.parse(localStorage.getItem('rights'));
  }

  setBranch(branch:string)
  {
	  localStorage.setItem('branch',branch);
  }

  getBranch():string |null
  {
	  return localStorage.getItem('branch');
  }

  setEmail(email:string)
  {
	  localStorage.setItem('email',email);
  }

  getEmail():string |null
  {
	  return localStorage.getItem('email');
  }

  setNickName(nickName:string)
  {
	  localStorage.setItem('nickName',nickName);
  }

  getNickName():string |null
  {
	  return localStorage.getItem('nickName');
  }

}