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
import { ToastModule } from 'primeng/toast';
import { MiscService } from '@/services/misc.service';
import { CellStaysService } from '../module/service';

@Component({
  selector: 'app-cell-stays-save',
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
    CardModule
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
  private readonly cellStaysService = inject(CellStaysService);

  form: FormGroup = this.fb.group({
    cellRegister: [null, [Validators.required, Validators.maxLength(50)]],
    entryDate: [null],
    observations: [null]
  });

  isEditMode = false;
  id: string | null = null;

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'] ?? null;
    this.isEditMode = !!this.id;

    if (this.isEditMode && this.id) {
      this.loadCellStay(this.id);
    }
  }

  loadCellStay(id: string) {
    this.miscService.startRequest();
    this.cellStaysService.getById(id).subscribe({
      next: (data) => {
        if (data) {
          this.form.patchValue({
            cellRegister: (data as any).cellRegister ?? null,
            entryDate: (data as any).entryDate ? String((data as any).entryDate).slice(0, 10) : null,
            observations: (data as any).observations ?? null
          });
        } else {
          this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo encontrar la estadía en celda', life: 3000 });
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

    const payload = this.form.value;
    this.miscService.startRequest();

    if (this.isEditMode && this.id) {
      this.cellStaysService.update(this.id, payload).subscribe(
        () => {
          this.messageService.add({
            key: 'msg',
            severity: 'success',
            detail: 'Estadía en celda actualizada correctamente',
            life: 3000
          });
          setTimeout(() => {
            this.router.navigate(['/cell-stays']);
            this.miscService.endRquest();
          }, 1000);
        },
        (error) => {
          this.miscService.endRquest();
          this.messageService.add({
            key: 'msg',
            severity: 'error',
            detail: 'Error al guardar la estadía en celda, error: ' + (error?.error?.message || error.message),
            life: 3000
          });
        }
      );
      return;
    }

    this.cellStaysService.create(payload).subscribe(
      () => {
        this.messageService.add({
          key: 'msg',
          severity: 'success',
          detail: 'Estadía en celda creada correctamente',
          life: 3000
        });
        setTimeout(() => {
          this.router.navigate(['/cell-stays']);
          this.miscService.endRquest();
        }, 1000);
      },
      (error) => {
        this.miscService.endRquest();
        this.messageService.add({
          key: 'msg',
          severity: 'error',
          detail: 'Error al guardar la estadía en celda, error: ' + (error?.error?.message || error.message),
          life: 3000
        });
      }
    );
  }

  onCancel(event) {
    event.preventDefault();
    this.router.navigate(['/cell-stays']);
  }
}
