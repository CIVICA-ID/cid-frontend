import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MedicalReportsService } from '../module/service';
import { PsychosocialReportsService } from '@/modules/psychosocial_reports/module/service';
import { MedicalReport } from '@/api/medical-report';
import { extractCreatedRecordId, getNextWorkflowStage, getPreviousWorkflowStage, getWorkflowActionLabel, getWorkflowSeed, WorkflowSeed } from '@/lib/workflow';

@Component({
  selector: 'app-medical-reports-view',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, ToastModule],
  providers: [MessageService],
  templateUrl: './template.html'
})
export class ViewComponent implements OnInit {
  medicalReport: MedicalReport | null = null;
  loading = true;
  error = false;
  readonly nextStage = getNextWorkflowStage('medical-reports');
  readonly previousStage = getPreviousWorkflowStage('medical-reports');

  private readonly medicalReportsService = inject(MedicalReportsService);
  private readonly psychosocialReportsService = inject(PsychosocialReportsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.router.navigate(['/medical-reports']);
      return;
    }
    this.loadMedicalReport(id);
  }

  loadMedicalReport(id: string) {
    this.loading = true;
    this.error = false;
    this.medicalReportsService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.medicalReport = data as MedicalReport;
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

  editMedicalReport() {
    if (this.medicalReport?.id) {
      this.router.navigate(['/medical-reports/edit', this.medicalReport.id]);
    }
  }

  toggleWorkflowState(): void {
    if (!this.medicalReport?.id) {
      return;
    }

    const workflowSeed = getWorkflowSeed('medical-reports', this.medicalReport);
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
    this.router.navigate(['/medical-reports']);
  }

  getWorkflowActionLabel(): string {
    return getWorkflowActionLabel('medical-reports', this.medicalReport?.processed);
  }

  private openOrCreateNextRecord(workflowSeed: WorkflowSeed): void {
    this.psychosocialReportsService.getList(1, 1, [], workflowSeed.lookupFilter).subscribe({
      next: (response) => {
        const rows = response?.data ?? response ?? [];
        const existing = Array.isArray(rows) ? rows[0] : null;
        const existingId = existing?.id ?? null;

        if (existingId) {
          this.router.navigate(['/psychosocial-reports/edit', existingId]);
          return;
        }

        this.psychosocialReportsService.create(workflowSeed.payload as any).subscribe({
          next: (created) => {
            const createdId = extractCreatedRecordId(created);
            if (!createdId) {
              this.messageService.add({
                severity: 'error',
                key: 'msg',
                summary: 'Error',
                detail: 'No se pudo obtener el ID del reporte psicosocial creado.',
                life: 3000
              });
              return;
            }

            this.router.navigate(['/psychosocial-reports/edit', createdId]);
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

  getStatusLabel(active?: boolean): string {
    if (active === true) {
      return 'Activo';
    }
    if (active === false) {
      return 'Inactivo';
    }
    return 'Sin estado';
  }

  getStatusSeverity(active?: boolean): 'success' | 'danger' | 'secondary' {
    if (active === true) {
      return 'success';
    }
    if (active === false) {
      return 'danger';
    }
    return 'secondary';
  }

  getProcessedLabel(processed?: boolean): string {
    if (processed === true) {
      return 'Procesado';
    }
    if (processed === false) {
      return 'Pendiente';
    }
    return 'Sin dato';
  }

  getProcessedSeverity(processed?: boolean): 'success' | 'warn' | 'secondary' {
    if (processed === true) {
      return 'success';
    }
    if (processed === false) {
      return 'warn';
    }
    return 'secondary';
  }

  getOffenderFullName(): string {
    const people = this.medicalReport?.offender?.people;
    const fullName = [people?.firstName, people?.paternalName, people?.maternalName]
      .filter((part) => !!part)
      .join(' ')
      .trim();

    return fullName || this.medicalReport?.offender?.id || this.medicalReport?.id_offender || '-';
  }

  getInitials(): string {
    const offenderName = this.getOffenderFullName();
    if (!offenderName || offenderName === '-') {
      return 'MR';
    }

    const words = offenderName.split(/\s+/).filter(Boolean);
    const first = words[0]?.[0] ?? '';
    const second = words[1]?.[0] ?? words[words.length - 1]?.[0] ?? '';
    return `${first}${second}`.toUpperCase();
  }
}
