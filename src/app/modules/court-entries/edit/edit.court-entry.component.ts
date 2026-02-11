import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { forkJoin, Observable } from 'rxjs';
import { CourtEntryService } from '@/services/court-entry.service';
import { AudiencesService } from '@/services/audiences.service';
import { MiscService } from '@/services/misc.service';
import { FormCourtEntryComponent } from '@/modules/court-entries/form/form-court-entry.component';

@Component({
    templateUrl: './edit.court-entry.component.html',
    imports: [CommonModule, ButtonModule, InputTextModule, ToastModule, ReactiveFormsModule, FormCourtEntryComponent, FormCourtEntryComponent],
    providers: [MessageService],
    standalone: true
})
export class EditCourtEntryComponent implements OnInit {
    data: Observable<any>;
    id: string = '';
    constructor(
        private courtEntryService: CourtEntryService,
        private audienceService: AudiencesService,
        private messageService: MessageService,
        private router: Router,
        private route: ActivatedRoute,
        private miscService: MiscService
    ) {}
    onFormEmitted(event) {
        forkJoin({
            audience: this.audienceService.update(this.id, event.formAudience),
            courtEntry: this.courtEntryService.update(event.formAudience.idCourtEntry, event.formCourtEntry)
        }).subscribe({
            next: () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail: 'Corte actualizada correctamente',
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
    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
    }
}
