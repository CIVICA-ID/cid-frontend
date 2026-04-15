import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MiscService {

  loading:boolean = false;
  pendingRequest:number = 0;

  private myPropertySubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  myProperty$: Observable<boolean> = this.myPropertySubject.asObservable();

  updateProperty(newValue: boolean): void 
  {
    this.myPropertySubject.next(newValue);
  }

  constructor() 
  { 
  }
  
  startRequest()
  {
	  this.pendingRequest++;
	  this.evalLoading();
  }
  
  endRquest()
  {
	//si aun quedan peticiones
	if(this.pendingRequest>0)
		this.pendingRequest--;
	
	this.evalLoading();	  
  }
  
  evalLoading()
  {
	//queda peticiones pendientes, 
	this.loading = this.pendingRequest>0;		
  }
}
