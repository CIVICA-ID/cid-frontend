import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { Observable } from 'rxjs';
import { MiscService } from '@/services/misc.service';
import { MedicalAreaService } from '@/services/medical-area.service';
import { FormMedicalAreaComponent } from '@/modules/medical_area/form/form-medical-area.component';

@Component({
    templateUrl: './add.medical-area.component.html',
    imports: [CommonModule, ButtonModule, InputTextModule, ToastModule, ReactiveFormsModule, FormMedicalAreaComponent],
    providers: [MessageService],
    standalone: true
})
export class AddMedicalAreaComponent {
    data: Observable<any>;
    constructor(
        private medicalAreaService: MedicalAreaService,
        private messageService: MessageService,
        private router: Router,
        private miscService: MiscService
    ) {}

    onFormEmitted(event) {
        this.miscService.startRequest();
        this.medicalAreaService.create(event).subscribe(
            () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail: 'Área médica creada correctamente',
                    life: 3000
                });
                setTimeout(() => {
                    this.router.navigate(['/medical_area']);
                    this.miscService.endRquest();
                }, 1000);
            },
            (error) => {
                this.miscService.endRquest();
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    detail: 'Error al guardar el área médica, error: ' + error.error.message,
                    life: 3000
                });
            }
        );
    }
}
