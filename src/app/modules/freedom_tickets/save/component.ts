import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Fluid } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MiscService } from '@/services/misc.service';
import { FreedomTicketsService } from '../module/service';
import { CellStaysService } from '@/modules/cell_stays/module/service';

@Component({
  selector: 'app-freedom-tickets-save',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    ToastModule,
    ReactiveFormsModule,
    FormsModule,
    Fluid,
    MessageModule,
    CardModule,
    SelectModule
  ],
  providers: [MessageService],
  templateUrl: './template.html'
})
export class SaveComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly miscService = inject(MiscService);
  private readonly freedomTicketsService = inject(FreedomTicketsService);
  private readonly cellStaysService = inject(CellStaysService);

  form: FormGroup = this.fb.group({
    idCellStay: [null, Validators.required],
    arrestHours: [null, Validators.required],
    releaseDate: [null, Validators.required],
    exitReason: [null, [Validators.required, Validators.maxLength(100)]],
    fineAmount: [null],
    paymentTicketFolio: [null, Validators.maxLength(50)],
    observations: [null],
    civilJudge: [null, [Validators.required, Validators.maxLength(150)]],
    custodian: [null, [Validators.required, Validators.maxLength(150)]]
  });

  isEditMode = false;
  id: string | null = null;
  cellStayOptions: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'] ?? null;
    this.isEditMode = !!this.id;

    this.loadCellStays();

    if (this.isEditMode && this.id) {
      this.loadFreedomTicket(this.id);
    }
  }

  loadCellStays() {
    this.cellStaysService.getListSimple().subscribe({
      next: (data) => {
        const rows = data ?? [];
        this.cellStayOptions = rows.map((item: any) => {
          const date = item.entryDate ? String(item.entryDate).slice(0, 10) : '';
          const label = date ? `${item.cellRegister} - ${date}` : item.cellRegister;
          return {
            label: label || item.id,
            value: item.id
          };
        });
      },
      error: () => {
        this.cellStayOptions = [];
      }
    });
  }

  loadFreedomTicket(id: string) {
    this.miscService.startRequest();
    this.freedomTicketsService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.form.patchValue({
            idCellStay: (data as any).cellStay?.id ?? (data as any).idCellStay ?? null,
            arrestHours: (data as any).arrestHours ?? null,
            releaseDate: (data as any).releaseDate ? String((data as any).releaseDate).slice(0, 10) : null,
            exitReason: (data as any).exitReason ?? null,
            fineAmount: (data as any).fineAmount ?? null,
            paymentTicketFolio: (data as any).paymentTicketFolio ?? null,
            observations: (data as any).observations ?? null,
            civilJudge: (data as any).civilJudge ?? null,
            custodian: (data as any).custodian ?? null
          });
        } else {
          this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo encontrar la boleta de libertad', life: 3000 });
        }
        this.miscService.endRquest();
      },
      error: (error) => {
        this.miscService.endRquest();
        this.messageService.add({ severity: 'error', key: 'msg', summary: 'Error', detail: 'Hubo un error al recibir la información, error: ' + (error?.error?.message || error.message), life: 3000 });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.messageService.add({
        key: 'msg',
        severity: 'error',
        detail: 'Formulario inválido',
        life: 3000
      });
      return;
    }

    const raw = this.form.value;
    const payload = {
      ...raw,
      arrestHours: raw.arrestHours !== null && raw.arrestHours !== '' ? Number(raw.arrestHours) : null,
      fineAmount: raw.fineAmount !== null && raw.fineAmount !== '' ? Number(raw.fineAmount) : null
    };
    this.miscService.startRequest();

    if (this.isEditMode && this.id) {
      this.freedomTicketsService.update(this.id, payload).subscribe(
        () => {
          this.messageService.add({
            key: 'msg',
            severity: 'success',
            detail: 'Boleta de libertad actualizada correctamente',
            life: 3000
          });
          setTimeout(() => {
            this.router.navigate(['/freedom-tickets']);
            this.miscService.endRquest();
          }, 1000);
        },
        (error) => {
          this.miscService.endRquest();
          this.messageService.add({
            key: 'msg',
            severity: 'error',
            detail: 'Error al guardar la boleta de libertad, error: ' + (error?.error?.message || error.message),
            life: 3000
          });
        }
      );
      return;
    }

    this.freedomTicketsService.create(payload).subscribe(
      () => {
        this.messageService.add({
          key: 'msg',
          severity: 'success',
          detail: 'Boleta de libertad creada correctamente',
          life: 3000
        });
        setTimeout(() => {
          this.router.navigate(['/freedom-tickets']);
          this.miscService.endRquest();
        }, 1000);
      },
      (error) => {
        this.miscService.endRquest();
        this.messageService.add({
          key: 'msg',
          severity: 'error',
          detail: 'Error al guardar la boleta de libertad, error: ' + (error?.error?.message || error.message),
          life: 3000
        });
      }
    );
  }

  onCancel(event) {
    event.preventDefault();
    this.router.navigate(['/freedom-tickets']);
  }
}
