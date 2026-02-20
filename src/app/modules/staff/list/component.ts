import { TableTemplateComponent } from '@/components/table-template/table-template.component';
import { PageSectionHeaderComponent } from '@/components/page-section-header/page-section-header.component';
import { MiscService } from '@/services/misc.service';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { catchError, finalize, forkJoin, of, Subject, switchMap, tap } from 'rxjs';
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
  private readonly reloadList$ = new Subject<void>();
  private destroyRef = inject(DestroyRef);

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
        takeUntilDestroyed(this.destroyRef)
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
    const idsToDelete = deleteType === 1 ? this.ids() : id ? [id] : [];

    if (idsToDelete.length === 0) return;

    const message =
      deleteType === 1
        ? `Se eliminarán ${idsToDelete.length} registros seleccionados. ¿Desea continuar?`
        : `Se eliminará ${this.getRecordDescription(id)}. ¿Desea continuar?`;

    this.confirmationService.confirm({
      message,
      header: 'Confirmar',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Aceptar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.isLoading.set(true);
        this.miscsService.startRequest();

        const requests = idsToDelete.map((itemId) =>
          this.staffService.disable(itemId).pipe(
            catchError((error: any) => {
              this.messageService.add({
                life: 5000,
                key: 'message',
                severity: 'error',
                summary: 'Error al eliminar',
                detail: error?.error?.message || error.message || `No se pudo eliminar el registro con ID: ${itemId}`
              });
              return of(null);
            })
          )
        );

        forkJoin(requests)
          .pipe(
            finalize(() => {
              this.isLoading.set(false);
              this.miscsService.endRquest();
              this.listTable();
              if (deleteType === 1) {
                this.ids.set([]);
              }
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((results) => {
            const successes = results.filter((r) => r !== null).length;
            if (successes > 0) {
              this.messageService.add({
                severity: 'success',
                key: 'message',
                summary: 'Operación exitosa',
                detail: `${successes} registro(s) procesado(s) correctamente`,
                life: 3000
              });
            }
          });
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
}
