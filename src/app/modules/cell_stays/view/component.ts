import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CellStaysService } from '../module/service';
import { BelongingsService } from '@/modules/belongings/module/service';
import { CellStay } from '@/api/cell-stay';
import { extractCreatedRecordId, getNextWorkflowStage, getPreviousWorkflowStage, getWorkflowActionLabel, getWorkflowSeed, WorkflowSeed } from '@/lib/workflow';

@Component({
  selector: 'app-cell-stays-view',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ToastModule],
  providers: [MessageService],
  templateUrl: './template.html'
})
export class ViewComponent implements OnInit {
  cellStay: CellStay | null = null;
  loading = true;
  error = false;
  readonly nextStage = getNextWorkflowStage('cell-stays');
  readonly previousStage = getPreviousWorkflowStage('cell-stays');

  private readonly cellStaysService = inject(CellStaysService);
  private readonly belongingsService = inject(BelongingsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.router.navigate(['/cell-stays']);
      return;
    }
    this.loadCellStay(id);
  }

  loadCellStay(id: string) {
    this.loading = true;
    this.error = false;
    this.cellStaysService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.cellStay = data as CellStay;
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

  get offenderName(): string {
    const people = (this.cellStay as any)?.offender?.people;
    if (people) {
      return [people.paternalName, people.maternalName, people.firstName]
        .filter(Boolean)
        .join(' ') || '-';
    }
    return (this.cellStay as any)?.id_offender ?? '-';
  }

  editCellStay() {
    if (this.cellStay?.id) {
      this.router.navigate(['/cell-stays/edit', this.cellStay.id]);
    }
  }

  toggleWorkflowState(): void {
    if (!this.cellStay?.id) {
      return;
    }

    const workflowSeed = getWorkflowSeed('cell-stays', this.cellStay);
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
    this.router.navigate(['/cell-stays']);
  }

  getWorkflowActionLabel(): string {
    return getWorkflowActionLabel('cell-stays', this.cellStay?.processed);
  }

  private openOrCreateNextRecord(workflowSeed: WorkflowSeed): void {
    this.belongingsService.getList(1, 1, [], workflowSeed.lookupFilter).subscribe({
      next: (response) => {
        const rows = response?.data ?? response ?? [];
        const existing = Array.isArray(rows) ? rows[0] : null;
        const existingId = existing?.id ?? null;

        if (existingId) {
          this.router.navigate(['/belongings/edit', existingId]);
          return;
        }

        this.belongingsService.create(workflowSeed.payload as any).subscribe({
          next: (created) => {
            const createdId = extractCreatedRecordId(created);
            if (!createdId) {
              this.messageService.add({
                severity: 'error',
                key: 'msg',
                summary: 'Error',
                detail: 'No se pudo obtener el ID de la pertenencia creada.',
                life: 3000
              });
              return;
            }

            this.router.navigate(['/belongings/edit', createdId]);
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
}
