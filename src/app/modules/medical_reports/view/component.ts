import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MedicalReportsService } from '../module/service';
import { MedicalReport } from '@/api/medical-report';

@Component({
  selector: 'app-medical-reports-view',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ToastModule],
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
}
