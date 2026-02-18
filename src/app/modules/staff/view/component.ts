import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { StaffService } from '../module/service';
import { Staff } from '@/api/staff';

@Component({
  selector: 'app-staff-view',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, ToastModule],
  providers: [MessageService],
  templateUrl: './template.html'
})
export class ViewComponent implements OnInit {
  staff: Staff | null = null;
  loading = true;
  error = false;

  private readonly staffService = inject(StaffService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.router.navigate(['/staff']);
      return;
    }
    this.loadStaff(id);
  }

  loadStaff(id: string) {
    this.loading = true;
    this.error = false;
    this.staffService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.staff = data as Staff;
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

  editStaff() {
    if (this.staff?.id) {
      this.router.navigate(['/staff/edit', this.staff.id]);
    }
  }

  backToList() {
    this.router.navigate(['/staff']);
  }

  getInitials(): string {
    const fullName = (this.staff?.full_name ?? '').trim();
    if (!fullName) {
      return 'ST';
    }

    const words = fullName.split(/\s+/).filter(Boolean);
    const first = words[0]?.[0] ?? '';
    const second = words[1]?.[0] ?? words[words.length - 1]?.[0] ?? '';
    return `${first}${second}`.toUpperCase();
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

  getFriendlyId(id?: string | null): string {
    if (!id) return '-';
    const prefix = id.slice(0, 8).toUpperCase();
    return `STF-${prefix}`;
  }

  getCompactUuid(id?: string | null): string {
    if (!id) return '-';
    return `${id.slice(0, 8).toUpperCase()}...${id.slice(-4).toUpperCase()}`;
  }

  async copyUuid(): Promise<void> {
    const id = this.staff?.id;
    if (!id) return;

    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      this.messageService.add({
        severity: 'warn',
        key: 'msg',
        summary: 'No se pudo copiar',
        detail: 'Clipboard no disponible en este navegador',
        life: 2500
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(id);
      this.messageService.add({
        severity: 'success',
        key: 'msg',
        summary: 'UUID copiado',
        detail: id,
        life: 2500
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        key: 'msg',
        summary: 'No se pudo copiar el UUID',
        life: 2500
      });
    }
  }
}
