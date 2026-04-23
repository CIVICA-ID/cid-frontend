import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { PeopleService } from '@/services/people.service';
import { catchError, EMPTY, forkJoin, of, switchMap, tap } from 'rxjs';
import { VehiclesService } from '@/services/vehicles.service';
import { CourtEntry } from '@/api/courtEntry';
import { CourtEntryService } from '@/services/court-entry.service';
import { Audience } from '@/api/audiences';
import { MiscService } from '@/services/misc.service';
import { AudiencesService } from '@/services/audiences.service';
import { People } from '@/api/people';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-service-view',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ToastModule],
    providers: [MessageService],
    templateUrl: './template.html'
})
export class ViewComponent implements OnInit {
    audience: Audience | null = null;
    courtEntry:CourtEntry = null;
    witnesses: People[] | null = [];
    loading = true;
    error = false;

    private readonly courtEntryService = inject(CourtEntryService);
    private readonly audienceService: AudiencesService = inject(AudiencesService);
    private readonly peopleService = inject(PeopleService);
    private readonly vehicleService = inject(VehiclesService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);
    private readonly miscService: MiscService = inject(MiscService);

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        if (!id) {
            this.router.navigate(['/court-entry']);
            return;
        }
        this.load(id);
    }

    load(id: string) {
        this.loading = true;
        this.error = false;
        forkJoin({
            audience: this.audienceService.getByCourtEntryId(id),
            courtEntry: this.courtEntryService.getById(id)
        })
            .pipe(
                switchMap((data) => {
                    const witnesses = data.audience?.witnesses || [];

                    if (witnesses.length > 0) {
                        const peopleRequests = witnesses.map((w) => this.peopleService.getById(w.idPeople));
                        return forkJoin(peopleRequests).pipe(map((people) => ({ ...data, people })));
                    }
                    return of({ ...data, people: [] as People[] });
                })
            )
            .subscribe({
                next: (result: { audience: Audience; people: People[]; courtEntry: any }) => {
                    this.loading = false;
                    this.audience = result.audience;
                    this.courtEntry = result.courtEntry;
                    this.witnesses = result.people;
                    this.miscService.endRquest();
                },
                error: (error) => {
                    this.loading = false;
                    this.miscService.endRquest();
                    this.messageService.add({
                        key: 'msg',
                        severity: 'error',
                        detail: 'Error: ' + (error.error?.message || error.message),
                        life: 3000
                    });
                }
            });
    }

    edit() {
        if (this.audience?.id) {
            this.router.navigate(['/court-entry/edit', this.audience.id]);
        }
    }

    toggleWorkflowState(): void {
        if (!this.audience?.id) {
            return;
        }
        this.backToList();
    }

    backToList() {
        this.router.navigate(['/court-entry']);
    }

    getWorkflowActionLabel(): string {
        return 'Regresar';
    }

}
