import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { Observable } from 'rxjs';
import { MedicalAreaService } from '@/services/medical-area.service';
import { FormMedicalAreaComponent } from '@/modules/medical_area/form/form-medical-area.component';

@Component({
    templateUrl: './edit.medical-area.component.html',
    imports: [CommonModule, ButtonModule, InputTextModule, ToastModule, ReactiveFormsModule, FormMedicalAreaComponent],
    providers: [MessageService],
    standalone: true
})
export class EditMedicalAreaComponent implements OnInit {
    data: Observable<any>;
    id: string = '';
    constructor(
        private medicalAreaService: MedicalAreaService,
        private messageService: MessageService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    onFormEmitted(event) {
        this.medicalAreaService.update(this.id, event).subscribe(
            () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail: 'Área médica actualizada correctamente',
                    life: 3000
                });
                setTimeout(() => {
                    this.router.navigate(['/medical_area']);
                }, 1000);
            },
            (error) => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    detail: 'Error al guardar el área médica, error: ' + error.error.message,
                    life: 3000
                });
            }
        );
    }

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
    }
}
