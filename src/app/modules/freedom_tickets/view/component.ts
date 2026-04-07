import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FreedomTicketsService } from '../module/service';
import { FreedomTicket } from '@/api/freedom-ticket';

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

  private readonly freedomTicketsService = inject(FreedomTicketsService);
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

  backToList() {
    this.router.navigate(['/freedom-tickets']);
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
