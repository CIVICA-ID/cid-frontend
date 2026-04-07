import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SeguimientoService } from '../module/service';
import { Seguimiento } from '@/api/seguimiento';

@Component({
  selector: 'app-seguimiento-view',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, ToastModule],
  providers: [MessageService],
  templateUrl: './template.html'
})
export class ViewComponent implements OnInit {
  seguimiento: Seguimiento | null = null;
  loading = true;
  error = false;

  private readonly seguimientoService = inject(SeguimientoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.router.navigate(['/seguimiento']);
      return;
    }
    this.loadSeguimiento(id);
  }

  loadSeguimiento(id: string) {
    this.loading = true;
    this.error = false;
    this.seguimientoService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.seguimiento = data as Seguimiento;
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

  editSeguimiento() {
    if (this.seguimiento?.id) {
      this.router.navigate(['/seguimiento/edit', this.seguimiento.id]);
    }
  }

  backToList() {
    this.router.navigate(['/seguimiento']);
  }

  getOffenderName(): string {
    const p = this.seguimiento?.offender?.people;
    if (!p) return '-';
    return `${p.paternalName ?? ''} ${p.maternalName ?? ''} ${p.firstName ?? ''}`.replace(/\s+/g, ' ').trim() || '-';
  }

  getStatusLabel(active?: boolean): string {
    if (active === true) return 'Activo';
    if (active === false) return 'Inactivo';
    return 'Sin estado';
  }

  getStatusSeverity(active?: boolean): 'success' | 'danger' | 'secondary' {
    if (active === true) return 'success';
    if (active === false) return 'danger';
    return 'secondary';
  }

  getFriendlyId(id?: string | null): string {
    if (!id) return '-';
    return `SEG-${id.slice(0, 8).toUpperCase()}`;
  }

  getCompactUuid(id?: string | null): string {
    if (!id) return '-';
    return `${id.slice(0, 8).toUpperCase()}...${id.slice(-4).toUpperCase()}`;
  }

  async copyUuid(): Promise<void> {
    const id = this.seguimiento?.id;
    if (!id) return;

    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      this.messageService.add({ severity: 'warn', key: 'msg', summary: 'No se pudo copiar', detail: 'Clipboard no disponible', life: 2500 });
      return;
    }

    try {
      await navigator.clipboard.writeText(id);
      this.messageService.add({ severity: 'success', key: 'msg', summary: 'UUID copiado', detail: id, life: 2500 });
    } catch {
      this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo copiar el UUID', life: 2500 });
    }
  }
}
