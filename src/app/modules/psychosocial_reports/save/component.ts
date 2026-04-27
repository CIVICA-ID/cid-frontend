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
import { PsychosocialReportsService } from '../module/service';
import { OffendersService } from '@/services/offenders.service';
import { StaffService } from '@/modules/staff/module/service';
import { DateTimePickerComponent } from '@/components/date-time-picker/date-time-picker.component';
import { deserializeApiDateTime } from '@/lib/date-time';
import { buildSaveErrorDetail } from '@/lib/http-error';

@Component({
  selector: 'app-psychosocial-reports-save',
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
  private readonly psychosocialReportsService = inject(PsychosocialReportsService);
  private readonly offendersService = inject(OffendersService);
  private readonly staffService = inject(StaffService);

  form: FormGroup = this.fb.group({
    id_offender: [null, [Validators.required]],
    id_staff: [null, [Validators.required]],
    dictation_date: [null, [Validators.required]],
    dictation: [null, [Validators.required, this.trimRequiredValidator(), Validators.maxLength(200)]],
    observations: [null, [Validators.maxLength(1000)]],
    processed: [false]
  });

  isEditMode = false;
  id: string | null = null;
  submitted = false;
  offenderOptions: { label: string; value: string }[] = [];
  staffOptions: { label: string; value: string }[] = [];

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

    this.loadOffenders();
    this.loadStaff();

    if (this.isEditMode && this.id) {
      this.loadPsychosocialReport(this.id);
    }
  }

  loadOffenders() {
    this.offendersService.getList(100, 1, [], {}).subscribe({
      next: (data) => {
        const rows = data?.data ?? data ?? [];
        this.offenderOptions = rows.map((item: any) => {
          const people = item.people;
          const name = people
            ? `${people.paternalName ?? ''} ${people.maternalName ?? ''} ${people.firstName ?? ''}`.replace(/\s+/g, ' ').trim()
            : '';
          return {
            label: name || item.id,
            value: item.id
          };
        });
      },
      error: () => {
        this.offenderOptions = [];
      }
    });
  }

  loadStaff() {
    this.staffService.getListSimple().subscribe({
      next: (data) => {
        const rows = data ?? [];
        this.staffOptions = rows.map((item: any) => {
          const fullName = (item?.full_name ?? '').trim();
          const professionalLicense = (item?.professional_license ?? '').trim();
          const label = fullName && professionalLicense ? `${fullName} - ${professionalLicense}` : fullName || professionalLicense || item.id;
          return {
            label,
            value: item.id
          };
        });
      },
      error: () => {
        this.staffOptions = [];
      }
    });
  }

  loadPsychosocialReport(id: string) {
    this.miscService.startRequest();
    this.psychosocialReportsService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.form.patchValue({
            id_offender: (data as any).offender?.id ?? (data as any).id_offender ?? null,
            id_staff: (data as any).staff?.id ?? (data as any).id_staff ?? null,
            dictation_date: deserializeApiDateTime((data as any).dictation_date),
            dictation: (data as any).dictation ?? null,
            observations: (data as any).observations ?? null,
            processed: (data as any).processed ?? false
          });
        } else {
          this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo encontrar el reporte psicosocial', life: 3000 });
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
      dictation: String(this.form.value.dictation ?? '').trim(),
      observations: this.form.value.observations ? String(this.form.value.observations).trim() : null,
    };
    delete payload.processed;

    this.miscService.startRequest();

    if (this.isEditMode && this.id) {
      this.psychosocialReportsService.update(this.id, payload).subscribe(
        () => {
          this.messageService.add({
            key: 'msg',
            severity: 'success',
            detail: 'Reporte psicosocial actualizado correctamente',
            life: 3000
          });
          setTimeout(() => {
            this.router.navigate(['/psychosocial-reports']);
            this.miscService.endRquest();
          }, 1000);
        },
        (error) => {
          this.miscService.endRquest();
          this.messageService.add({
            key: 'msg',
            severity: 'error',
            detail: buildSaveErrorDetail(error, 'el reporte psicosocial'),
            life: 3000
          });
        }
      );
      return;
    }

    this.psychosocialReportsService.create(payload).subscribe(
      () => {
        this.messageService.add({
          key: 'msg',
          severity: 'success',
          detail: 'Reporte psicosocial creado correctamente',
          life: 3000
        });
        setTimeout(() => {
          this.router.navigate(['/psychosocial-reports']);
          this.miscService.endRquest();
        }, 1000);
      },
      (error) => {
        this.miscService.endRquest();
        this.messageService.add({
          key: 'msg',
          severity: 'error',
          detail: buildSaveErrorDetail(error, 'el reporte psicosocial'),
          life: 3000
        });
      }
    );
  }

  onCancel(event: Event) {
    event.preventDefault();
    this.router.navigate(['/psychosocial-reports']);
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched || this.submitted);
  }

  textLength(controlName: string): number {
    const value = this.form.get(controlName)?.value;
    return typeof value === 'string' ? value.length : 0;
  }
}
