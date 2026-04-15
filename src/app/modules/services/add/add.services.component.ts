import { MiscService } from '@/services/misc.service';
import { ServicesService } from '@/services/services.service';
import { MedicalReportsService } from '@/modules/medical_reports/module/service';
import { extractCreatedRecordId } from '@/lib/workflow';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { FormServicesComponent } from '../form/form-services.component';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

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
        private medicalReportsService: MedicalReportsService,
        private messageService: MessageService,
        private router: Router,
        private miscService: MiscService
    ) {}
    onFormEmitted(event) {
        this.miscService.startRequest();
        this.servicesService.create(event).subscribe(
            (createdService: any) => {
                const serviceId = extractCreatedRecordId(createdService);
                if (!serviceId) {
                    this.messageService.add({
                        key: 'msg',
                        severity: 'success',
                        detail:"Servicio creado correctamente",
                        life: 3000
                    });
                    this.router.navigate(['/services']);
                    this.miscService.endRquest();
                    return;
                }

                this.seedInitialMedicalReports(serviceId);
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

    private seedInitialMedicalReports(serviceId: string): void {
        this.servicesService.getById(serviceId).subscribe({
            next: (service: any) => {
                const offenderIds = Array.isArray(service?.offenders)
                    ? service.offenders
                        .map((offender: any) => offender?.id ?? null)
                        .filter((id: string | null): id is string => !!id)
                    : [];

                if (offenderIds.length === 0) {
                    this.finishSuccess('Servicio creado correctamente', '/services');
                    return;
                }

                const requests = offenderIds.map((idOffender) => this.ensureMedicalReport(idOffender));
                forkJoin(requests).subscribe({
                    next: (reportIds: Array<string | null>) => {
                        const firstReportId = reportIds.find((id): id is string => !!id);
                        this.finishSuccess(
                            'Servicio creado correctamente. Se inicializó el primer reporte médico.',
                            firstReportId ? `/medical-reports/edit/${firstReportId}` : '/services'
                        );
                    },
                    error: (error) => {
                        this.miscService.endRquest();
                        this.messageService.add({
                            key: 'msg',
                            severity: 'error',
                            detail: 'El servicio se creó, pero no se pudo preparar el reporte médico inicial: ' + (error?.error?.message || error.message),
                            life: 3000
                        });
                    }
                });
            },
            error: (error) => {
                this.miscService.endRquest();
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    detail: 'El servicio se creó, pero no se pudo leer su información para inicializar el reporte médico: ' + (error?.error?.message || error.message),
                    life: 3000
                });
            }
        });
    }

    private ensureMedicalReport(idOffender: string): Observable<string | null> {
        return this.medicalReportsService.getList(1, 1, [], { id_offender: `$eq:${idOffender}` }).pipe(
            switchMap((response: any) => {
                const rows = response?.data ?? response ?? [];
                const existing = Array.isArray(rows) ? rows[0] : null;
                const existingId = existing?.id ?? null;

                if (existingId) {
                    return of(existingId);
                }

                return this.medicalReportsService.create({ id_offender: idOffender }).pipe(
                    map((created: any) => extractCreatedRecordId(created))
                );
            })
        );
    }

    private finishSuccess(detail: string, redirectTo: string): void {
        this.messageService.add({
            key: 'msg',
            severity: 'success',
            detail,
            life: 3000
        });
        setTimeout(() => {
            this.router.navigateByUrl(redirectTo);
            this.miscService.endRquest();
        }, 1000);
    }
}
