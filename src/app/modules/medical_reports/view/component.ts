import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MedicalReportsService } from '../module/service';
import { MedicalReport } from '@/api/medical-report';

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

  private readonly medicalReportsService = inject(MedicalReportsService);
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

  backToList() {
    this.router.navigate(['/medical-reports']);
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
