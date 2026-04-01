import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MedicalReportsService } from '../module/service';
import { OffendersService } from '@/services/offenders.service';
import { StaffService } from '@/modules/staff/module/service';
import { DatePicker } from 'primeng/datepicker';

@Component({
  selector: 'app-medical-reports-save',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    DatePicker,
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
  private readonly medicalReportsService = inject(MedicalReportsService);
  private readonly offendersService = inject(OffendersService);
  private readonly staffService = inject(StaffService);

  form: FormGroup = this.fb.group({
    id_offender: [null],
    id_staff: [null],
    dictation_date: [null],
    rh_factor: [null],
    blood_type: [null],
    entry_status: [null, [Validators.maxLength(50)]],
    weight: [null, [Validators.min(0)]],
    height: [null, [Validators.min(0)]],
    dictation: [null, [Validators.maxLength(2000)]],
    observations: [null, [Validators.maxLength(1000)]]
  });

  isEditMode = false;
  id: string | null = null;
  submitted = false;
  offenderOptions: { label: string; value: string }[] = [];
  staffOptions: { label: string; value: string }[] = [];

  bloodTypeOptions = [
    { label: 'A', value: 'A' },
    { label: 'B', value: 'B' },
    { label: 'AB', value: 'AB' },
    { label: 'O', value: 'O' },
  ];

  public admissionConditions =  signal([
    { label: 'SOBRIO', value: 'SOBRIO' },
    { label: 'ALIENTO ALCOHOLICO', value: 'ALIENTO ALCOHOLICO' },
    { label: 'EBRIO', value: 'EBRIO' },
    { label: 'BAJO EFECTOS DE ESTUPEFACIENTES', value: 'BAJO EFECTOS DE ESTUPEFACIENTES' },
    { label: 'BAJO EFECTOS DE INHALANTES', value: 'BAJO EFECTOS DE INHALANTES' },
    { label: 'BAJO EFECTOS DE PSICOTROPICOS', value: 'BAJO EFECTOS DE PSICOTROPICOS' },
    { label: 'BAJO EFECTOS DE TOXICOS', value: 'BAJO EFECTOS DE TOXICOS' }
  ]);

  public factorRhOptions = signal([
    { label: 'RH +', value: '+' },
    { label: 'RH -', value: '-' }
  ]);

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'] ?? null;
    this.isEditMode = !!this.id;

    this.loadOffenders();
    this.loadStaff();

    if (this.isEditMode && this.id) {
      this.loadMedicalReport(this.id);
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

  loadMedicalReport(id: string) {
    this.miscService.startRequest();
    this.medicalReportsService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.form.patchValue({
            id_offender: (data as any).offender?.id ?? (data as any).id_offender ?? null,
            id_staff: (data as any).staff?.id ?? (data as any).id_staff ?? null,
            dictation_date: (data as any).dictation_date ? new Date((data as any).dictation_date) : null,
            rh_factor: (data as any).rh_factor ?? null,
            blood_type: (data as any).blood_type ?? null,
            entry_status: (data as any).entry_status ?? null,
            weight: (data as any).weight ?? null,
            height: (data as any).height ?? null,
            dictation: (data as any).dictation ?? null,
            observations: (data as any).observations ?? null
          });
        } else {
          this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo encontrar el reporte médico', life: 3000 });
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
      id_offender: raw.id_offender || null,
      id_staff: raw.id_staff || null,
      dictation_date: this.serializeDateTimeForApi(raw.dictation_date),
      rh_factor: raw.rh_factor ? String(raw.rh_factor).trim() : null,
      blood_type: raw.blood_type ? String(raw.blood_type).trim() : null,
      entry_status: raw.entry_status ? String(raw.entry_status).trim() : null,
      weight: raw.weight !== null && raw.weight !== '' ? Number(raw.weight) : null,
      height: raw.height !== null && raw.height !== '' ? Number(raw.height) : null,
      dictation: raw.dictation ? String(raw.dictation).trim() : null,
      observations: raw.observations ? String(raw.observations).trim() : null
    };

    this.miscService.startRequest();

    if (this.isEditMode && this.id) {
      this.medicalReportsService.update(this.id, payload).subscribe(
        () => {
          this.messageService.add({
            key: 'msg',
            severity: 'success',
            detail: 'Reporte médico actualizado correctamente',
            life: 3000
          });
          setTimeout(() => {
            this.router.navigate(['/medical-reports']);
            this.miscService.endRquest();
          }, 1000);
        },
        (error) => {
          this.miscService.endRquest();
          this.messageService.add({
            key: 'msg',
            severity: 'error',
            detail: 'Error al guardar el reporte médico, error: ' + (error?.error?.message || error.message),
            life: 3000
          });
        }
      );
      return;
    }

    this.medicalReportsService.create(payload).subscribe(
      () => {
        this.messageService.add({
          key: 'msg',
          severity: 'success',
          detail: 'Reporte médico creado correctamente',
          life: 3000
        });
        setTimeout(() => {
          this.router.navigate(['/medical-reports']);
          this.miscService.endRquest();
        }, 1000);
      },
      (error) => {
        this.miscService.endRquest();
        this.messageService.add({
          key: 'msg',
          severity: 'error',
          detail: 'Error al guardar el reporte médico, error: ' + (error?.error?.message || error.message),
          life: 3000
        });
      }
    );
  }

  onCancel(event: Event) {
    event.preventDefault();
    this.router.navigate(['/medical-reports']);
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched || this.submitted);
  }

  textLength(controlName: string): number {
    const value = this.form.get(controlName)?.value;
    return typeof value === 'string' ? value.length : 0;
  }

  private serializeDateTimeForApi(value: unknown): string | null {
    if (value instanceof Date) {
      return this.toIsoStringWithOffset(value);
    }

    if (value === null || value === undefined) {
      return null;
    }

    const normalizedValue = String(value).trim();
    return normalizedValue.length ? normalizedValue : null;
  }

  private toIsoStringWithOffset(date: Date): string {
    const pad = (value: number): string => String(Math.trunc(Math.abs(value))).padStart(2, '0');
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absoluteOffsetMinutes = Math.abs(offsetMinutes);
    const offsetHours = Math.floor(absoluteOffsetMinutes / 60);
    const remainingOffsetMinutes = absoluteOffsetMinutes % 60;

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(offsetHours)}:${pad(remainingOffsetMinutes)}`;
  }
}
