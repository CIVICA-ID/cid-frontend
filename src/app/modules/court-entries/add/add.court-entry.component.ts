import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { forkJoin, Observable } from 'rxjs';
import { MiscService } from '@/services/misc.service';
import { CourtEntryService } from '@/services/court-entry.service';
import { FormCourtEntryComponent } from '@/modules/court-entries/form/form-court-entry.component';
import { AudiencesService } from '@/services/audiences.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    templateUrl: './add.court-entry.component.html',
    imports: [CommonModule, ButtonModule, InputTextModule, ToastModule, ReactiveFormsModule, FormCourtEntryComponent],
    providers: [MessageService],
    standalone: true
})
export class AddCourtEntryComponent {
    data: Observable<any>;
    constructor(
        private courtEntryService: CourtEntryService,
        private audienceService: AudiencesService,
        private messageService: MessageService,
        private router: Router,
        private miscService: MiscService
    ) {}
    onFormEmitted(event) {
        this.miscService.startRequest();
        forkJoin({
            audience: this.audienceService.create(event.formAudience),
            courtEntry: this.courtEntryService.update(event.formAudience.idCourtEntry, event.courtEntry)
        }).subscribe({
            next: () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail: 'Corte creada correctamente',
                    life: 3000
                });
                setTimeout(() => {
                    this.router.navigate(['/court-entry']);
                    this.miscService.endRquest();
                }, 1000);
            },
            error: (error) => {
                this.miscService.endRquest();
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    detail: 'Error al guardar la corte, error: ' + error.error.message,
                    life: 3000
                });
            }
        });
    }
}
