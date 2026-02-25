import { FreedomTicket } from '@/api/freedom-ticket';
import { TableTemplateComponent } from '@/components/table-template/table-template.component';
import { MiscService } from '@/services/misc.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { catchError, finalize, forkJoin, of, Subject, switchMap, tap } from 'rxjs';
import { FreedomTicketsService } from '../module/service';

type SortExpression = string[][];
type SearchFilters = Record<string, string>;

type TableFieldType = 'text' | 'date' | 'numeric' | 'boolean' | 'states' | 'image' | 'uuid';

interface TableColumn {
  field: string;
  column: string;
  columnType: TableFieldType;
  fieldType: TableFieldType;
}

interface ListParamsEvent {
  page: number;
  limit: number;
  search: SearchFilters;
  sort: SortExpression;
}

interface FreedomTicketsListResponse {
  data?: FreedomTicket[];
  meta?: {
    totalItems?: number;
  };
}

type DeleteType = 1 | 2;

@Component({
  selector: 'app-list-freedom-tickets',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToolbarModule, ConfirmDialogModule, ToastModule, TableTemplateComponent, RouterModule],
  providers: [FreedomTicketsService, MessageService, ConfirmationService],
  templateUrl: './template.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent implements OnInit {
  readonly columns: TableColumn[] = [
    {
      field: 'cellStay.cellRegister',
      column: 'Registro celda',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'releaseDate',
      column: 'Fecha de liberación',
      columnType: 'date',
      fieldType: 'date'
    },
    {
      field: 'exitReason',
      column: 'Motivo de salida',
      columnType: 'text',
      fieldType: 'text'
    }
  ];

  readonly totalRows = signal<number>(0);
  readonly data = signal<FreedomTicket[]>([]);
  readonly configTable = computed(() => ({
    module: 'Boletas de libertad',
    route: 'freedom-tickets',
    view: true,
    totalRows: this.totalRows()
  }));

  limit = 10;
  search: SearchFilters = {};
  sort: SortExpression = [];
  page = 1;
  readonly ids = signal<string[]>([]);
  readonly isLoading = signal<boolean>(false);

  private readonly reloadList$ = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly freedomTicketsService: FreedomTicketsService,
    private readonly messageService: MessageService,
    private readonly miscService: MiscService,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.reloadList$
      .pipe(
        tap(() => this.setLoadingState(true)),
        switchMap(() =>
          this.freedomTicketsService.getList(this.limit, this.page, this.sort, this.search).pipe(
            catchError((error: unknown) => {
              this.resetList();
              this.showErrorMessage('Error cargando la lista de boletas de libertad', error);
              return of<FreedomTicketsListResponse | null>(null);
            }),
            finalize(() => this.setLoadingState(false))
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => this.handleListResponse(response));
  }

  listTable(): void {
    this.reloadList$.next();
  }

  handleParamsList(event: ListParamsEvent): void {
    this.page = event.page;
    this.limit = event.limit;
    this.search = event.search;
    this.sort = event.sort;
    this.listTable();
  }

  delete(id: string | null, deleteType: DeleteType): void {
    const idsToDelete = this.resolveIdsToDelete(id, deleteType);

    if (idsToDelete.length === 0) {
      return;
    }

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
      accept: () => this.deleteRecords(idsToDelete, deleteType)
    });
  }

  getIdsDeleted(ids: string[]): void {
    this.ids.set(Array.from(new Set(ids)));
  }

  private handleListResponse(response: FreedomTicketsListResponse | null): void {
    if (!response) {
      return;
    }

    const rows = Array.isArray(response.data) ? response.data : [];
    const totalItems = response.meta?.totalItems ?? rows.length;

    if (totalItems > 0 || rows.length > 0) {
      this.data.set(rows);
      this.totalRows.set(totalItems > 0 ? totalItems : rows.length);
      return;
    }

    this.messageService.add({
      life: 5000,
      key: 'message',
      severity: 'warn',
      summary: 'No se encontraron boletas de libertad',
      detail: ''
    });
    this.resetList();
  }

  private resolveIdsToDelete(id: string | null, deleteType: DeleteType): string[] {
    if (deleteType === 1) {
      return this.ids();
    }
    return id ? [id] : [];
  }

  private deleteRecords(idsToDelete: string[], deleteType: DeleteType): void {
    this.setLoadingState(true);

    const requests = idsToDelete.map((itemId) =>
      this.freedomTicketsService.disable(itemId).pipe(
        catchError((error: unknown) => {
          this.messageService.add({
            life: 5000,
            key: 'message',
            severity: 'error',
            summary: 'Error al eliminar',
            detail: this.getErrorDetail(error, `No se pudo eliminar el registro con ID: ${itemId}`)
          });
          return of(null);
        })
      )
    );

    forkJoin(requests)
      .pipe(
        finalize(() => {
          this.setLoadingState(false);
          this.listTable();
          if (deleteType === 1) {
            this.ids.set([]);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((results) => {
        const successes = results.reduce<number>((acc, result) => (result !== null ? acc + 1 : acc), 0);

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

  private getDeepValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  private setLoadingState(loading: boolean): void {
    this.isLoading.set(loading);
    if (loading) {
      this.miscService.startRequest();
      return;
    }
    this.miscService.endRquest();
  }

  private resetList(): void {
    this.data.set([]);
    this.totalRows.set(0);
  }

  private showErrorMessage(summary: string, error: unknown): void {
    this.messageService.add({
      life: 5000,
      key: 'message',
      severity: 'error',
      summary,
      detail: this.getErrorDetail(error, 'Ocurrió un error inesperado')
    });
  }

  private getErrorDetail(error: unknown, fallback: string): string {
    if (error && typeof error === 'object') {
      const typedError = error as { error?: { message?: string }; message?: string };
      return typedError.error?.message || typedError.message || fallback;
    }
    return fallback;
  }
}
