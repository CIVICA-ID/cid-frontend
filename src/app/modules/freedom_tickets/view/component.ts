import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FreedomTicketsService } from '../module/service';
import { SeguimientoService } from '@/modules/seguimiento/module/service';
import { FreedomTicket } from '@/api/freedom-ticket';
import { extractCreatedRecordId, getNextWorkflowStage, getPreviousWorkflowStage, getWorkflowActionLabel, getWorkflowSeed, WorkflowSeed } from '@/lib/workflow';

@Component({
  selector: 'app-freedom-tickets-view',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ToastModule],
  providers: [MessageService],
  templateUrl: './template.html'
})
export class ViewComponent implements OnInit {
  freedomTicket: FreedomTicket | null = null;
  loading = true;
  error = false;
  readonly nextStage = getNextWorkflowStage('freedom-tickets');
  readonly previousStage = getPreviousWorkflowStage('freedom-tickets');

  private readonly freedomTicketsService = inject(FreedomTicketsService);
  private readonly seguimientoService = inject(SeguimientoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.router.navigate(['/freedom-tickets']);
      return;
    }
    this.loadFreedomTicket(id);
  }

  loadFreedomTicket(id: string) {
    this.loading = true;
    this.error = false;
    this.freedomTicketsService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.freedomTicket = data as FreedomTicket;
        } else {
          this.error = true;
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.error = true;
        this.messageService.add({ severity: 'error', key: 'msg', summary: 'Error', detail: error?.error?.message || error.message, life: 3000 });
      }
    });
  }

  editFreedomTicket() {
    if (this.freedomTicket?.id) {
      this.router.navigate(['/freedom-tickets/edit', this.freedomTicket.id]);
    }
  }

  toggleWorkflowState(): void {
    if (!this.freedomTicket?.id) {
      return;
    }

    const workflowSeed = getWorkflowSeed('freedom-tickets', this.freedomTicket);
    if (!workflowSeed) {
      this.messageService.add({
        severity: 'error',
        key: 'msg',
        summary: 'Error',
        detail: 'No se pudo preparar el siguiente módulo para este caso.',
        life: 3000
      });
      return;
    }

    this.openOrCreateNextRecord(workflowSeed);
  }

  backToList() {
    this.router.navigate(['/freedom-tickets']);
  }

  getWorkflowActionLabel(): string {
    return getWorkflowActionLabel('freedom-tickets', this.freedomTicket?.processed);
  }

  private openOrCreateNextRecord(workflowSeed: WorkflowSeed): void {
    this.seguimientoService.getList(1, 1, [], workflowSeed.lookupFilter).subscribe({
      next: (response) => {
        const rows = response?.data ?? response ?? [];
        const existing = Array.isArray(rows) ? rows[0] : null;
        const existingId = existing?.id ?? null;

        if (existingId) {
          this.router.navigate(['/seguimiento/edit', existingId]);
          return;
        }

        this.seguimientoService.create(workflowSeed.payload as any).subscribe({
          next: (created) => {
            const createdId = extractCreatedRecordId(created);
            if (!createdId) {
              this.messageService.add({
                severity: 'error',
                key: 'msg',
                summary: 'Error',
                detail: 'No se pudo obtener el ID del seguimiento creado.',
                life: 3000
              });
              return;
            }

            this.router.navigate(['/seguimiento/edit', createdId]);
          },
          error: (error) => {
            this.messageService.add({ severity: 'error', key: 'msg', summary: 'Error', detail: error?.error?.message || error.message, life: 3000 });
          }
        });
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', key: 'msg', summary: 'Error', detail: error?.error?.message || error.message, life: 3000 });
      }
    });
  }

  get offenderName(): string {
    const people = (this.freedomTicket as any)?.cellStay?.offender?.people;
    const fullName = [people?.paternalName, people?.maternalName, people?.firstName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || (this.freedomTicket as any)?.cellStay?.id_offender || this.freedomTicket?.idCellStay || '-';
  }
}
