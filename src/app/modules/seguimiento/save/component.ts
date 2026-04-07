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
import { SeguimientoService } from '../module/service';
import { OffendersService } from '@/services/offenders.service';
import { DateTimePickerComponent } from '@/components/date-time-picker/date-time-picker.component';
import { deserializeApiDateTime } from '@/lib/date-time';
import { PrimeNG } from 'primeng/config';

@Component({
  selector: 'app-seguimiento-save',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    DateTimePickerComponent,
    SelectModule,
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
  private readonly miscService = inject(MiscService);
  private readonly seguimientoService = inject(SeguimientoService);
  private readonly offendersService = inject(OffendersService);
  private readonly primeNG = inject(PrimeNG);

  form: FormGroup = this.fb.group({
    idOffender: [null],
    followType: [null, [Validators.required, this.trimRequiredValidator(), Validators.maxLength(100)]],
    followDate: [null],
    description: [null, [Validators.required, this.trimRequiredValidator()]]
  });

  isEditMode = false;
  id: string | null = null;
  submitted = false;
  offenderOptions: { label: string; value: string }[] = [];

  private trimRequiredValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined) return null;
      if (typeof control.value !== 'string') return null;
      return control.value.trim().length > 0 ? null : { whitespace: true };
    };
  }

  ngOnInit(): void {
    this.primeNG.setTranslation({
      firstDayOfWeek: 1,
      dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
      monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      today: 'Hoy',
      clear: 'Limpiar'
    });

    this.id = this.route.snapshot.params['id'] ?? null;
    this.isEditMode = !!this.id;

    this.loadOffenders();

    if (this.isEditMode && this.id) {
      this.loadSeguimiento(this.id);
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

  loadSeguimiento(id: string) {
    this.miscService.startRequest();
    this.seguimientoService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.form.patchValue({
            idOffender: (data as any).offender?.id ?? (data as any).idOffender ?? null,
            followType: (data as any).followType ?? null,
            followDate: deserializeApiDateTime((data as any).followDate),
            description: (data as any).description ?? null
          });
        } else {
          this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo encontrar el registro de seguimiento', life: 3000 });
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
      this.messageService.add({ key: 'msg', severity: 'error', detail: 'Formulario inválido', life: 3000 });
      return;
    }

    const raw = this.form.value;
    const payload = {
      idOffender: raw.idOffender || null,
      followType: String(raw.followType ?? '').trim(),
      followDate: raw.followDate ?? null,
      description: String(raw.description ?? '').trim()
    };

    this.miscService.startRequest();

    if (this.isEditMode && this.id) {
      this.seguimientoService.update(this.id, payload).subscribe(
        () => {
          this.messageService.add({ key: 'msg', severity: 'success', detail: 'Seguimiento actualizado correctamente', life: 3000 });
          setTimeout(() => { this.router.navigate(['/seguimiento']); this.miscService.endRquest(); }, 1000);
        },
        (error) => {
          this.miscService.endRquest();
          this.messageService.add({ key: 'msg', severity: 'error', detail: 'Error al guardar el seguimiento, error: ' + (error?.error?.message || error.message), life: 3000 });
        }
      );
      return;
    }

    this.seguimientoService.create(payload).subscribe(
      () => {
        this.messageService.add({ key: 'msg', severity: 'success', detail: 'Seguimiento creado correctamente', life: 3000 });
        setTimeout(() => { this.router.navigate(['/seguimiento']); this.miscService.endRquest(); }, 1000);
      },
      (error) => {
        this.miscService.endRquest();
        this.messageService.add({ key: 'msg', severity: 'error', detail: 'Error al guardar el seguimiento, error: ' + (error?.error?.message || error.message), life: 3000 });
      }
    );
  }

  onCancel(event: Event) {
    event.preventDefault();
    this.router.navigate(['/seguimiento']);
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
