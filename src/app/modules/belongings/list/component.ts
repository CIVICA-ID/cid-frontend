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
import { BelongingsService } from '../module/service';

@Component({
  selector: 'app-list-belongings',
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
  providers: [BelongingsService, MessageService, ConfirmationService],
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
      field: 'cellStay.cellRegister',
      column: 'Registro celda',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'recipient',
      column: 'Receptor',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'value',
      column: 'Valor',
      columnType: 'numeric',
      fieldType: 'numeric'
    },
    {
      field: 'quantity',
      column: 'Cantidad',
      columnType: 'numeric',
      fieldType: 'numeric'
    },
    {
      field: 'measurementUnit',
      column: 'Unidad de medida',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'serialNumber',
      column: 'Número de serie',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'brand',
      column: 'Marca',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'description',
      column: 'Descripción',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'observation',
      column: 'Observación',
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
    private belongingsService: BelongingsService,
    private messageService: MessageService,
    private miscsService: MiscService,
    private confirmationService: ConfirmationService
  ) {}

  listTable(): void {
    this.miscsService.startRequest();
    this.belongingsService.getList(this.limit, this.page, this.sort, this.search).subscribe({
      next: (data) => {
        if (data?.meta?.totalItems) {
          this.data = data['data'];
          this.totalRows = data['meta']['totalItems'];
        } else {
          this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error', detail: 'No se encontraron pertenencias' });
          this.data = [];
          this.totalRows = 0;
        }
        this.configTable = {
          module: 'Pertenencias',
          route: 'belongings',
          totalRows: this.totalRows
        };
        this.miscsService.endRquest();
      },
      error: (error) => {
        this.miscsService.endRquest();
        this.data = [];
        this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error cargando la lista de pertenencias', detail: error?.error?.message || error.message });
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
            this.belongingsService.disable(id).subscribe(
              () => {
                this.listTable();
                this.messageService.add({ severity: 'success', key: 'message', summary: 'Operación exitosa', life: 3000 });
              },
              (error) => {
                this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error al eliminar la pertenencia', detail: error?.error?.message || error.message });
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
      const req = this.belongingsService.disable(this.ids[i]).pipe(
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
