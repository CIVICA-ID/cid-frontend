import { MiscService } from '@/services/misc.service';
import { ServicesService } from '@/services/services.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { FormServicesComponent } from '../form/form-services.component';
import { Observable } from 'rxjs';

@Component({
    templateUrl: './add.services.component.html',
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
export class AddServicesComponent {
    data: Observable<any>;
    constructor(
        private servicesService: ServicesService,
        private messageService: MessageService,
        private router: Router,
        private miscService: MiscService
    ) {}
    onFormEmitted(event) {
        this.miscService.startRequest();
        this.servicesService.create(event).subscribe(
            () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail:"Servicio creado correctamente",
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
}
