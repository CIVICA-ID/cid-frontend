import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { BelongingsService } from '../module/service';
import { Belonging } from '@/api/belonging';

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

  private readonly belongingsService = inject(BelongingsService);
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

  backToList() {
    this.router.navigate(['/belongings']);
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
