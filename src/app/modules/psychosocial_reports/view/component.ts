import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { PsychosocialReportsService } from '../module/service';
import { PsychosocialReport } from '@/api/psychosocial-report';

@Component({
  selector: 'app-psychosocial-reports-view',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ToastModule],
  providers: [MessageService],
  templateUrl: './template.html'
})
export class ViewComponent implements OnInit {
  psychosocialReport: PsychosocialReport | null = null;
  loading = true;
  error = false;

  private readonly psychosocialReportsService = inject(PsychosocialReportsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.router.navigate(['/psychosocial-reports']);
      return;
    }
    this.loadPsychosocialReport(id);
  }

  loadPsychosocialReport(id: string) {
    this.loading = true;
    this.error = false;
    this.psychosocialReportsService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.psychosocialReport = data as PsychosocialReport;
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

  editPsychosocialReport() {
    if (this.psychosocialReport?.id) {
      this.router.navigate(['/psychosocial-reports/edit', this.psychosocialReport.id]);
    }
  }

  backToList() {
    this.router.navigate(['/psychosocial-reports']);
  }
}
