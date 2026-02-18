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
import { MedicalReportsService } from '../module/service';
import { OffendersService } from '@/services/offenders.service';
import { StaffService } from '@/modules/staff/module/service';

@Component({
  selector: 'app-medical-reports-save',
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
  private readonly medicalReportsService = inject(MedicalReportsService);
  private readonly offendersService = inject(OffendersService);
  private readonly staffService = inject(StaffService);

  form: FormGroup = this.fb.group({
    id_offender: [null],
    id_staff: [null],
    dictation_date: [null],
    rh_factor: [null, [Validators.maxLength(5)]],
    blood_type: [null],
    entry_status: [null, [Validators.maxLength(50)]],
    weight: [null],
    height: [null],
    dictation: [null],
    observations: [null]
  });

  isEditMode = false;
  id: string | null = null;
  offenderOptions: { label: string; value: string }[] = [];
  staffOptions: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'] ?? null;
    this.isEditMode = !!this.id;

    this.loadOffenders();
    this.loadStaff();

    if (this.isEditMode && this.id) {
      this.loadMedicalReport(this.id);
    }
  }

  bloodTypeOptions = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' }
  ];

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
            dictation_date: (data as any).dictation_date ? String((data as any).dictation_date).slice(0, 10) : null,
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
      weight: raw.weight !== null && raw.weight !== '' ? Number(raw.weight) : null,
      height: raw.height !== null && raw.height !== '' ? Number(raw.height) : null
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

  onCancel(event) {
    event.preventDefault();
    this.router.navigate(['/medical-reports']);
  }
}
