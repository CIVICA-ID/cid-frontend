import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CellStaysService } from '../module/service';
import { CellStay } from '@/api/cell-stay';

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

  private readonly cellStaysService = inject(CellStaysService);
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

  backToList() {
    this.router.navigate(['/cell-stays']);
  }
}
