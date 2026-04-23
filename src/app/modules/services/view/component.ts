import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { Service } from '@/api/service';
import { ServicesService } from '@/services/services.service';
import { PeopleService } from '@/services/people.service';
import { catchError, EMPTY, forkJoin, of, switchMap, tap } from 'rxjs';
import { People } from '@/api/people';
import { Vehicle } from '@/api/vehicle';
import { VehiclesService } from '@/services/vehicles.service';

@Component({
    selector: 'app-service-view',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ToastModule],
    providers: [MessageService],
    templateUrl: './template.html'
})
export class ViewComponent implements OnInit {
    service: Service | null = null;
    affected: People[] | null = null;
    involvedVehicle: Vehicle | null = null;
    offenders: People[] | null = null;
    loading = true;
    error = false;

    private readonly serviceService = inject(ServicesService);
    private readonly peopleService = inject(PeopleService);
    private readonly vehicleService = inject(VehiclesService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        if (!id) {
            this.router.navigate(['/services']);
            return;
        }
        this.loadSeguimiento(id);
    }

    loadSeguimiento(id: string) {
        this.loading = true;
        this.error = false;
        this.serviceService
            .getById(id)
            .pipe(
                switchMap((data) => {
                    if (data) {
                        this.service = data as Service;
                        const affectedPetitions = data.affected.map((affectedPeople) => this.peopleService.getById(affectedPeople.idPeople));
                        const offendersPetitions = data.offenders.map((offenderPeople) => this.peopleService.getById(offenderPeople.idPeople));
                        const vehiclePetition = this.vehicleService.getById(data.involvedVehicle.idVehicle);

                        // Retornamos el forkJoin para que el flujo espere estas respuestas
                        return forkJoin({
                            affected: affectedPetitions.length > 0 ? forkJoin(affectedPetitions) : of([]),
                            offenders: offendersPetitions.length > 0 ? forkJoin(offendersPetitions) : of([]),
                            vehiculo: vehiclePetition
                        });
                    } else {
                        this.error = true;
                        return EMPTY;
                    }
                }),
                tap(({ affected, offenders, vehiculo }: { affected: People[]; offenders: People[]; vehiculo: Vehicle| null}) => {
                    this.loading = false;
                    this.involvedVehicle = vehiculo;
                    this.affected = affected;
                    this.offenders = offenders;
                }),
                catchError((error) => {
                    this.loading = false;
                    this.error = true;
                    this.messageService.add({
                        severity: 'error',
                        key: 'msg',
                        summary: 'Error',
                        detail: error?.error?.message || error.message,
                        life: 3000
                    });
                    return EMPTY;
                })
            )
            .subscribe();
    }

    edit() {
        if (this.service?.id) {
            this.router.navigate(['/services/edit', this.service.id]);
        }
    }

    toggleWorkflowState(): void {
        if (!this.service?.id) {
            return;
        }
        this.backToList();
    }

    backToList() {
        this.router.navigate(['/services']);
    }

    getWorkflowActionLabel(): string {
        return 'Regresar';
    }

}
