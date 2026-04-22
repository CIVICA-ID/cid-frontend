import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Fluid } from 'primeng/fluid';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MiscService } from '@/services/misc.service';
import { FreedomTicketsService } from '../module/service';
import { CellStaysService } from '@/modules/cell_stays/module/service';
import { DateTimePickerComponent } from '@/components/date-time-picker/date-time-picker.component';
import { deserializeApiDateTime } from '@/lib/date-time';

interface CellStayOption {
  label: string;
  value: string;
}

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
    SelectModule,
    IconFieldModule,
    InputIconModule,
    DateTimePickerComponent
  ],
  providers: [MessageService],
  templateUrl: './template.html'
})
export class SaveComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  readonly miscService = inject(MiscService);
  private readonly freedomTicketsService = inject(FreedomTicketsService);
  private readonly cellStaysService = inject(CellStaysService);

  form: FormGroup = this.fb.group({
    idCellStay: [null, [Validators.required]],
    arrestHours: [null, [Validators.required, Validators.min(0)]],
    releaseDate: [null, [Validators.required]],
    exitReason: [null, [Validators.required, this.trimRequiredValidator(), Validators.maxLength(100)]],
    fineAmount: [null, [Validators.min(0)]],
    paymentTicketFolio: [null, [Validators.maxLength(50)]],
    observations: [null, [Validators.maxLength(500)]],
    civilJudge: [null, [Validators.required, this.trimRequiredValidator(), Validators.maxLength(150)]],
    custodian: [null, [Validators.required, this.trimRequiredValidator(), Validators.maxLength(150)]],
    processed: [false]
  });

  isEditMode = false;
  id: string | null = null;
  submitted = false;
  cellStayOptions: CellStayOption[] = [];

  private trimRequiredValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined) {
        return null;
      }

      if (typeof control.value !== 'string') {
        return null;
      }

      return control.value.trim().length > 0 ? null : { whitespace: true };
    };
  }

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
          return {
            label: this.buildCellStayLabel(item),
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
            releaseDate: deserializeApiDateTime((data as any).releaseDate),
            exitReason: (data as any).exitReason ?? null,
            fineAmount: (data as any).fineAmount ?? null,
            paymentTicketFolio: (data as any).paymentTicketFolio ?? null,
            observations: (data as any).observations ?? null,
            civilJudge: (data as any).civilJudge ?? null,
            custodian: (data as any).custodian ?? null,
            processed: (data as any).processed ?? false
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
    this.submitted = true;

    if (this.miscService.loading) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        key: 'msg',
        severity: 'error',
        detail: 'Formulario inválido',
        life: 3000
      });
      return;
    }

    const raw = this.form.value as any;
    const payload: any = {
      ...raw,
      arrestHours: raw.arrestHours !== null && raw.arrestHours !== '' ? Number(raw.arrestHours) : null,
      exitReason: String(raw.exitReason ?? '').trim(),
      fineAmount: raw.fineAmount !== null && raw.fineAmount !== '' ? Number(raw.fineAmount) : null,
      paymentTicketFolio: raw.paymentTicketFolio ? String(raw.paymentTicketFolio).trim() : null,
      observations: raw.observations ? String(raw.observations).trim() : null,
      civilJudge: String(raw.civilJudge ?? '').trim(),
      custodian: String(raw.custodian ?? '').trim()
    };
    delete payload.processed;

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

  onCancel(event: Event) {
    event.preventDefault();
    this.router.navigate(['/freedom-tickets']);
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched || this.submitted);
  }

  textLength(controlName: string): number {
    const value = this.form.get(controlName)?.value;
    return typeof value === 'string' ? value.length : 0;
  }

  private buildCellStayLabel(item: any): string {
    const people = item?.offender?.people;
    const offenderName = [people?.paternalName, people?.maternalName, people?.firstName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const entryDate = deserializeApiDateTime(item?.entryDate);
    const dateLabel = entryDate
      ? new Intl.DateTimeFormat('es-MX', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(entryDate)
      : 'Sin fecha';
    const cellLabel = item?.cellRegister ? `Celda ${item.cellRegister}` : null;

    return [offenderName || item?.id || 'Sin infractor', dateLabel, cellLabel].filter(Boolean).join(' | ');
  }
}
