import { TableTemplateComponent } from '@/components/table-template/table-template.component';
import { PageSectionHeaderComponent } from '@/components/page-section-header/page-section-header.component';
import { MiscService } from '@/services/misc.service';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { catchError, finalize, forkJoin, Observable, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { StaffService } from '../module/service';

@Component({
  selector: 'app-list-staff',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule,
    PageSectionHeaderComponent,
    TableTemplateComponent,
    RouterModule
  ],
  providers: [StaffService, MessageService, ConfirmationService],
  templateUrl: './template.html'
})
export class ListComponent implements OnInit, OnDestroy {
  columns = [
    {
      field: 'full_name',
      column: 'Nombre completo',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'specialty',
      column: 'Especialidad',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'phone',
      column: 'Teléfono',
      columnType: 'text',
      fieldType: 'text'
    },
  ];
  totalRows = signal<number>(0);
  data = signal<any[]>([]);
  activeRows = computed(() => this.data().filter((row) => row?.active === true).length);
  inactiveRows = computed(() => this.data().filter((row) => row?.active === false).length);
  configTable = computed(() => ({
    module: 'Staff',
    route: 'staff',
    view: true,
    totalRows: this.totalRows()
  }));
  limit = 10;
  search = {};
  sort: string[][] = [];
  page = 1;
  ids = signal<string[]>([]);
  selectedRows = computed(() => this.ids().length);
  isLoading = signal<boolean>(false);
  searchTerm = '';
  list: Observable<any>;
  confirmDisplay = false;
  private readonly reloadList$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private staffService: StaffService,
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
          this.staffService.getList(this.limit, this.page, this.sort, this.search).pipe(
            catchError((error: any) => {
              this.data.set([]);
              this.totalRows.set(0);
              this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error cargando la lista de staff', detail: error?.error?.message || error.message });
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
          this.messageService.add({ life: 5000, key: 'message', severity: 'warn', summary: 'No se encontró información de staff', detail: '' });
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
            this.staffService.disable(id).subscribe(
              () => {
                this.listTable();
                this.messageService.add({ severity: 'success', key: 'message', summary: 'Operación exitosa', life: 3000 });
              },
              (error) => {
                this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error al eliminar el registro de staff', detail: error?.error?.message || error.message });
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
    console.log("aqui se obtienen los ids seleccionados:", ids);  
    this.ids.set(ids);
  }

  deleteSelected() {
    console.log('IDs a eliminar:', this.ids());
    this.confirmDisplay = true;
    const requests: any[] = [];
    const selectedIds = this.ids();
    for (let i = 0; i < selectedIds.length; i++) {
      const req = this.staffService.disable(selectedIds[i]).pipe(
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
