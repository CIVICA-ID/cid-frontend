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
import { BelongingsService } from '../module/service';
import { CellStaysService } from '@/modules/cell_stays/module/service';
import { deserializeApiDateTime } from '@/lib/date-time';

interface CellStayOption {
  label: string;
  value: string;
  entryDate?: Date | null;
}

@Component({
  selector: 'app-belongings-save',
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
    InputIconModule
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
  private readonly belongingsService = inject(BelongingsService);
  private readonly cellStaysService = inject(CellStaysService);

  form: FormGroup = this.fb.group({
    id_cell_stay: [null, [Validators.required]],
    belonging: [null, [Validators.required, this.trimRequiredValidator(), Validators.maxLength(150)]],
    recipient: [null, [Validators.required, this.trimRequiredValidator(), Validators.maxLength(150)]],
    value: [null, [Validators.required, Validators.min(0)]],
    serialNumber: [null, [Validators.maxLength(100)]],
    brand: [null, [Validators.maxLength(100)]],
    description: [null, [Validators.maxLength(500)]],
    quantity: [null, [Validators.required, Validators.min(1)]],
    measurementUnit: [null, [Validators.required, this.trimRequiredValidator(), Validators.maxLength(50)]],
    observation: [null, [Validators.maxLength(500)]]
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
      this.loadBelonging(this.id);
    }
  }

  loadCellStays() {
    this.cellStaysService.getListSimple().subscribe({
      next: (data) => {
        const rows = data ?? [];
        this.cellStayOptions = rows.map((item: any) => {
          const entryDate = deserializeApiDateTime(item.entryDate);
          return {
            label: this.buildCellStayLabel(item),
            value: item.id,
            entryDate
          };
        });
      },
      error: () => {
        this.cellStayOptions = [];
      }
    });
  }

  loadBelonging(id: string) {
    this.miscService.startRequest();
    this.belongingsService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.form.patchValue({
            id_cell_stay: (data as any).cellStay?.id ?? (data as any).id_cell_stay ?? null,
            belonging: (data as any).belonging ?? null,
            recipient: (data as any).recipient ?? null,
            value: (data as any).value ?? null,
            serialNumber: (data as any).serialNumber ?? null,
            brand: (data as any).brand ?? null,
            description: (data as any).description ?? null,
            quantity: (data as any).quantity ?? null,
            measurementUnit: (data as any).measurementUnit ?? null,
            observation: (data as any).observation ?? null
          });
        } else {
          this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo encontrar la pertenencia', life: 3000 });
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

    const raw = this.form.value;
    const payload = {
      ...raw,
      belonging: String(raw.belonging ?? '').trim(),
      recipient: String(raw.recipient ?? '').trim(),
      value: raw.value !== null && raw.value !== '' ? Number(raw.value) : null,
      serialNumber: raw.serialNumber ? String(raw.serialNumber).trim() : null,
      brand: raw.brand ? String(raw.brand).trim() : null,
      description: raw.description ? String(raw.description).trim() : null,
      quantity: raw.quantity !== null && raw.quantity !== '' ? Number(raw.quantity) : null,
      measurementUnit: String(raw.measurementUnit ?? '').trim(),
      observation: raw.observation ? String(raw.observation).trim() : null
    };

    this.miscService.startRequest();

    if (this.isEditMode && this.id) {
      this.belongingsService.update(this.id, payload).subscribe(
        () => {
          this.messageService.add({
            key: 'msg',
            severity: 'success',
            detail: 'Pertenencia actualizada correctamente',
            life: 3000
          });
          setTimeout(() => {
            this.router.navigate(['/belongings']);
            this.miscService.endRquest();
          }, 1000);
        },
        (error) => {
          this.miscService.endRquest();
          this.messageService.add({
            key: 'msg',
            severity: 'error',
            detail: 'Error al guardar la pertenencia, error: ' + (error?.error?.message || error.message),
            life: 3000
          });
        }
      );
      return;
    }

    this.belongingsService.create(payload).subscribe(
      () => {
        this.messageService.add({
          key: 'msg',
          severity: 'success',
          detail: 'Pertenencia creada correctamente',
          life: 3000
        });
        setTimeout(() => {
          this.router.navigate(['/belongings']);
          this.miscService.endRquest();
        }, 1000);
      },
      (error) => {
        this.miscService.endRquest();
        this.messageService.add({
          key: 'msg',
          severity: 'error',
          detail: 'Error al guardar la pertenencia, error: ' + (error?.error?.message || error.message),
          life: 3000
        });
      }
    );
  }

  onCancel(event: Event) {
    event.preventDefault();
    this.router.navigate(['/belongings']);
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched || this.submitted);
  }

  textLength(controlName: string): number {
    const value = this.form.get(controlName)?.value;
    return typeof value === 'string' ? value.length : 0;
  }

  get selectedEntryDate(): Date | null {
    const cellStayId = this.form.get('id_cell_stay')?.value;
    if (!cellStayId) {
      return null;
    }

    return this.cellStayOptions.find((item) => item.value === cellStayId)?.entryDate ?? null;
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
