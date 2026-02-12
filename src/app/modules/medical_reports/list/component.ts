import { TableTemplateComponent } from '@/components/table-template/table-template.component';
import { MiscService } from '@/services/misc.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { MedicalReportsService } from '../module/service';

@Component({
  selector: 'app-list-medical-reports',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    ToolbarModule,
    ConfirmDialogModule,
    DialogModule,
    RippleModule,
    ToastModule,
    TableTemplateComponent,
    RouterModule
  ],
  providers: [MedicalReportsService, MessageService, ConfirmationService],
  templateUrl: './template.html'
})
export class ListComponent {
  columns = [
    {
      field: 'id',
      column: 'ID',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'staff.full_name',
      column: 'Responsable',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'offender.id',
      column: 'Infractor',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'blood_type',
      column: 'Tipo de sangre',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'rh_factor',
      column: 'RH',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'entry_status',
      column: 'Estado ingreso',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'dictation_date',
      column: 'Fecha dictamen',
      columnType: 'date',
      fieldType: 'date'
    },
    {
      field: 'dictation',
      column: 'Dictamen',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'observations',
      column: 'Observaciones',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'weight',
      column: 'Peso (kg)',
      columnType: 'numeric',
      fieldType: 'numeric'
    },
    {
      field: 'height',
      column: 'Altura (m)',
      columnType: 'numeric',
      fieldType: 'numeric'
    },
    {
      field: 'id_staff',
      column: 'ID staff',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'active',
      column: 'Activo',
      columnType: 'boolean',
      fieldType: 'boolean'
    }
  ];
  totalRows = 0;
  configTable: any = {};
  data = [];
  limit = 10;
  search = {};
  sort: string[][] = [];
  page = 1;
  ids: string[] = [];
  searchTerm = '';
  list: Observable<any>;
  confirmDisplay = false;

  constructor(
    private medicalReportsService: MedicalReportsService,
    private messageService: MessageService,
    private miscsService: MiscService,
    private confirmationService: ConfirmationService
  ) {}

  listTable(): void {
    this.miscsService.startRequest();
    this.medicalReportsService.getList(this.limit, this.page, this.sort, this.search).subscribe({
      next: (data) => {
        if (data?.meta?.totalItems) {
          this.data = data['data'];
          this.totalRows = data['meta']['totalItems'];
        } else {
          this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error', detail: 'No se encontraron reportes médicos' });
          this.data = [];
          this.totalRows = 0;
        }
        this.configTable = {
          module: 'Reportes médicos',
          route: 'medical-reports',
          totalRows: this.totalRows
        };
        this.miscsService.endRquest();
      },
      error: (error) => {
        this.miscsService.endRquest();
        this.data = [];
        this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error cargando la lista de reportes médicos', detail: error?.error?.message || error.message });
      }
    });
  }

  handleParamsList(event: any) {
    this.page = event.page;
    this.limit = event.limit;
    this.search = event.search;
    this.sort = event.sort;
    this.listTable();
  }

  delete(id, deleteType: number) {
    const message = deleteType == 1 ? 'los registros seleccionados' : 'el registro';
    this.confirmationService.confirm({
      message: `¿Confirma eliminar ${message}?`,
      header: 'Confirmar',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Aceptar',
      rejectLabel: 'Cancelar',
      accept: () => {
        switch (deleteType) {
          case 1:
            this.deleteSelected();
            break;
          case 2:
            this.medicalReportsService.disable(id).subscribe(
              () => {
                this.listTable();
                this.messageService.add({ severity: 'success', key: 'message', summary: 'Operación exitosa', life: 3000 });
              },
              (error) => {
                this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error al eliminar el reporte médico', detail: error?.error?.message || error.message });
              }
            );
            break;
        }
      }
    });
  }

  getIdsDeleted(ids: string[]) {
    this.ids = ids;
  }

  deleteSelected() {
    this.confirmDisplay = true;
    const requests: any[] = [];
    for (let i = 0; i < this.ids.length; i++) {
      const req = this.medicalReportsService.disable(this.ids[i]).pipe(
        catchError((error) => {
          this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error al eliminar el registro', detail: error.message });
          return of(null);
        })
      );
      requests.push(req);
    }
    forkJoin(requests).subscribe(
      () => {
        this.messageService.add({ severity: 'success', key: 'message', summary: 'Operación exitosa', detail: 'Registros eliminados exitosamente', life: 3000 });
        this.listTable();
        this.ids = [];
      },
      (err) => {
        this.messageService.add({ severity: 'error', key: 'message', summary: 'Error al eliminar registros', detail: err.message, life: 3000 });
      }
    );
  }
}
