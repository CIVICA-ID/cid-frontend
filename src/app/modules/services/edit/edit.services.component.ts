import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { FormServicesComponent } from '../form/form-services.component';
import { Observable } from 'rxjs';
import { MiscService } from '@/services/misc.service';
import { ServicesService } from '@/services/services.service';

@Component({
    templateUrl: './edit.services.component.html',
    imports: [
        CommonModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        ReactiveFormsModule,
        FormServicesComponent
    ],
    providers: [MessageService],
    standalone: true
})
export class EditServicesComponent implements OnInit{
    data: Observable<any>;
    id:string='';
    constructor(
        private servicesService: ServicesService,
        private messageService: MessageService,
        private router: Router,
        private miscService: MiscService,
        private route:ActivatedRoute
    ) {}
    onFormEmitted(event) {
        this.miscService.startRequest();
        this.servicesService.update(this.id,event).subscribe(
            () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail:"Servicio actualizado correctamente",
                    life: 3000
                });
                setTimeout(() => {
                    this.router.navigate(['/services']);
                    this.miscService.endRquest();
                }, 1000);
            },
            (error) => {
                this.miscService.endRquest();
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    detail: 'Error al guardar el servicio, error: ' + error.error.message,
                    life: 3000
                });
            }
        );
    }
    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.data=this.servicesService.getById(this.id);
    }
}