import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { BelongingsService } from '../module/service';
import { FreedomTicketsService } from '@/modules/freedom_tickets/module/service';
import { Belonging } from '@/api/belonging';
import { extractCreatedRecordId, getNextWorkflowStage, getPreviousWorkflowStage, getWorkflowActionLabel, getWorkflowSeed, WorkflowSeed } from '@/lib/workflow';

@Component({
  selector: 'app-belongings-view',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ToastModule],
  providers: [MessageService],
  templateUrl: './template.html'
})
export class ViewComponent implements OnInit {
  belonging: Belonging | null = null;
  loading = true;
  error = false;
  readonly nextStage = getNextWorkflowStage('belongings');
  readonly previousStage = getPreviousWorkflowStage('belongings');

  private readonly belongingsService = inject(BelongingsService);
  private readonly freedomTicketsService = inject(FreedomTicketsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.router.navigate(['/belongings']);
      return;
    }
    this.loadBelonging(id);
  }

  loadBelonging(id: string) {
    this.loading = true;
    this.error = false;
    this.belongingsService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.belonging = data as Belonging;
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

  editBelonging() {
    if (this.belonging?.id) {
      this.router.navigate(['/belongings/edit', this.belonging.id]);
    }
  }

  toggleWorkflowState(): void {
    if (!this.belonging?.id) {
      return;
    }

    const workflowSeed = getWorkflowSeed('belongings', this.belonging);
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
    this.router.navigate(['/belongings']);
  }

  getWorkflowActionLabel(): string {
    return getWorkflowActionLabel('belongings', this.belonging?.processed);
  }

  private openOrCreateNextRecord(workflowSeed: WorkflowSeed): void {
    this.freedomTicketsService.getList(1, 1, [], workflowSeed.lookupFilter).subscribe({
      next: (response) => {
        const rows = response?.data ?? response ?? [];
        const existing = Array.isArray(rows) ? rows[0] : null;
        const existingId = existing?.id ?? null;

        if (existingId) {
          this.router.navigate(['/freedom-tickets/edit', existingId]);
          return;
        }

        this.freedomTicketsService.create(workflowSeed.payload as any).subscribe({
          next: (created) => {
            const createdId = extractCreatedRecordId(created);
            if (!createdId) {
              this.messageService.add({
                severity: 'error',
                key: 'msg',
                summary: 'Error',
                detail: 'No se pudo obtener el ID de la boleta de libertad creada.',
                life: 3000
              });
              return;
            }

            this.router.navigate(['/freedom-tickets/edit', createdId]);
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
    const people = (this.belonging as any)?.cellStay?.offender?.people;
    const fullName = [people?.paternalName, people?.maternalName, people?.firstName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || (this.belonging as any)?.cellStay?.id_offender || this.belonging?.id_cell_stay || '-';
  }
}
