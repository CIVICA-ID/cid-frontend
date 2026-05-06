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
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MiscService } from '@/services/misc.service';
import { StaffService } from '../module/service';
import { buildSaveErrorDetail } from '@/lib/http-error';

@Component({
  selector: 'app-staff-save',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ReactiveFormsModule,
    FormsModule,
    Fluid,
    MessageModule,
    CardModule,
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
  readonly miscService = inject(MiscService);
  private readonly staffService = inject(StaffService);

  form: FormGroup = this.fb.group({
    full_name: [null, [Validators.required, this.trimRequiredValidator(), Validators.maxLength(150)]],
    professional_license: [null, [Validators.required, this.trimRequiredValidator(), Validators.maxLength(50)]],
    specialty: [null, [Validators.maxLength(100)]],
    phone: [null, [Validators.maxLength(20), Validators.pattern(/^[0-9+\-() ]+$/)]],
    email: [null, [Validators.email, Validators.maxLength(100)]]
  });

  isEditMode = false;
  id: string | null = null;
  submitted = false;

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

    if (this.isEditMode && this.id) {
      this.loadStaff(this.id);
    }
  }

  loadStaff(id: string) {
    this.miscService.startRequest();
    this.staffService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.form.patchValue({
            full_name: (data as any).full_name ?? null,
            professional_license: (data as any).professional_license ?? null,
            specialty: (data as any).specialty ?? null,
            phone: (data as any).phone ?? null,
            email: (data as any).email ?? null
          });
        } else {
          this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo encontrar el registro de staff', life: 3000 });
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

    const payload = {
      ...this.form.value,
      full_name: String(this.form.value.full_name ?? '').trim(),
      professional_license: String(this.form.value.professional_license ?? '').trim(),
      specialty: this.form.value.specialty ? String(this.form.value.specialty).trim() : null,
      phone: this.form.value.phone ? String(this.form.value.phone).trim() : null,
      email: this.form.value.email ? String(this.form.value.email).trim() : null
    };
    this.miscService.startRequest();

    if (this.isEditMode && this.id) {
      this.staffService.update(this.id, payload).subscribe(
        () => {
          this.messageService.add({
            key: 'msg',
            severity: 'success',
            detail: 'Registro de staff actualizado correctamente',
            life: 3000
          });
          setTimeout(() => {
            this.router.navigate(['/staff']);
            this.miscService.endRquest();
          }, 1000);
        },
        (error) => {
          this.miscService.endRquest();
          this.messageService.add({
            key: 'msg',
            severity: 'error',
            detail: buildSaveErrorDetail(error, 'el registro de staff'),
            life: 3000
          });
        }
      );
      return;
    }

    this.staffService.create(payload).subscribe(
      () => {
        this.messageService.add({
          key: 'msg',
          severity: 'success',
          detail: 'Registro de staff creado correctamente',
          life: 3000
        });
        setTimeout(() => {
          this.router.navigate(['/staff']);
          this.miscService.endRquest();
        }, 1000);
      },
      (error) => {
        this.miscService.endRquest();
        this.messageService.add({
          key: 'msg',
          severity: 'error',
          detail: buildSaveErrorDetail(error, 'el registro de staff'),
          life: 3000
        });
      }
    );
  }

  onCancel(event: Event) {
    event.preventDefault();
    this.router.navigate(['/staff']);
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
