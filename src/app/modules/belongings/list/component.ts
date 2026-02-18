import { TableTemplateComponent } from '@/components/table-template/table-template.component';
import { MiscService } from '@/services/misc.service';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
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
import { catchError, finalize, forkJoin, Observable, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
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
export class ListComponent implements OnInit, OnDestroy {
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
  totalRows = signal<number>(0);
  data = signal<any[]>([]);
  configTable = computed(() => ({
    module: 'Pertenencias',
    route: 'belongings',
    totalRows: this.totalRows()
  }));
  limit = 10;
  search = {};
  sort: string[][] = [];
  page = 1;
  ids = signal<string[]>([]);
  isLoading = signal<boolean>(false);
  searchTerm = '';
  list: Observable<any>;
  confirmDisplay = false;
  private readonly reloadList$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private belongingsService: BelongingsService,
    private messageService: MessageService,
    private miscsService: MiscService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.reloadList$
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.miscsService.startRequest();
        }),
        switchMap(() =>
          this.belongingsService.getList(this.limit, this.page, this.sort, this.search).pipe(
            catchError((error: any) => {
              this.data.set([]);
              this.totalRows.set(0);
              this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error cargando la lista de pertenencias', detail: error?.error?.message || error.message });
              return of(null);
            }),
            finalize(() => {
              this.isLoading.set(false);
              this.miscsService.endRquest();
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        if (!data) {
          return;
        }

        if (data?.meta?.totalItems) {
          this.data.set(data['data']);
          this.totalRows.set(data['meta']['totalItems']);
        } else {
          this.messageService.add({ life: 5000, key: 'message', severity: 'warn', summary: 'No se encontraron pertenencias', detail: '' });
          this.data.set([]);
          this.totalRows.set(0);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.reloadList$.complete();
  }

  listTable(): void {
    this.reloadList$.next();
  }

  handleParamsList(event: any) {
    this.page = event.page;
    this.limit = event.limit;
    this.search = event.search;
    this.sort = event.sort;
    this.listTable();
  }

  delete(id: string | null, deleteType: number) {
    const message =
      deleteType === 1
        ? `Se eliminarán ${this.ids().length} registros seleccionados. ¿Desea continuar?`
        : `Se eliminará ${this.getRecordDescription(id)}. ¿Desea continuar?`;

    this.confirmationService.confirm({
      message,
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
            if (!id) {
              return;
            }
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

  private getRecordDescription(id: string | null): string {
    if (!id) {
      return 'el registro seleccionado';
    }

    const row = this.data().find((item) => item?.id === id);
    if (!row) {
      return `el registro con ID ${id}`;
    }

    const candidateFields = this.columns
      .map((column) => column.field)
      .filter((field) => field !== 'id' && field !== 'active');

    for (const field of candidateFields) {
      const value = this.getDeepValue(row, field);
      if (value === null || value === undefined || `${value}`.trim() === '') {
        continue;
      }
      return `el registro "${value}"`;
    }

    return `el registro con ID ${id}`;
  }

  private getDeepValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => (acc || {})[key], obj);
  }

  getIdsDeleted(ids: string[]) {
    this.ids.set(ids);
  }

  deleteSelected() {
    this.confirmDisplay = true;
    const requests: any[] = [];
    const selectedIds = this.ids();
    for (let i = 0; i < selectedIds.length; i++) {
      const req = this.belongingsService.disable(selectedIds[i]).pipe(
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
        this.ids.set([]);
      },
      (err) => {
        this.messageService.add({ severity: 'error', key: 'message', summary: 'Error al eliminar registros', detail: err.message, life: 3000 });
      }
    );
  }
}
