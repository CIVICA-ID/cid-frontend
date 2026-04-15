import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { catchError, finalize, forkJoin, Observable, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MedicalReport } from '@/api/medical-report';
import { PageSectionHeaderComponent } from '@/components/page-section-header/page-section-header.component';
import { TableTemplateComponent } from '@/components/table-template/table-template.component';
import { MiscService } from '@/services/misc.service';
import { MedicalReportsService } from '../module/service';
import { getWorkflowStage } from '@/lib/workflow';

@Component({
  selector: 'app-list-medical-reports',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule,
    RippleModule,
    ToastModule,
    TableTemplateComponent,
    PageSectionHeaderComponent,
    RouterModule
  ],
  providers: [MedicalReportsService, MessageService, ConfirmationService],
  templateUrl: './template.html'
})
export class ListComponent implements OnInit, OnDestroy {
  readonly columns = [
    {
      field: 'staff.full_name',
      column: 'Responsable',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'offender.people.firstName',
      column: 'Infractor',
      columnType: 'text',
      fieldType: 'text'
    },
    {
      field: 'dictation_date',
      column: 'Fecha dictamen',
      columnType: 'date',
      fieldType: 'datetime'
    }
  ];

  readonly totalRows = signal<number>(0);
  readonly data = signal<MedicalReport[]>([]);
  readonly configTable = computed(() => ({
    module: 'Reportes médicos',
    route: 'medical-reports',
    view: true,
    hideAdd: true,
    hideDelete: true,
    totalRows: this.totalRows()
  }));
  readonly workflowStage = getWorkflowStage('medical-reports');
  limit = 10;
  search = {};
  sort: string[][] = [];
  page = 1;
  readonly ids = signal<string[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly selectedRows = computed(() => this.ids().length);
  searchTerm = '';
  list: Observable<any>;
  confirmDisplay = false;
  private readonly reloadList$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly medicalReportsService: MedicalReportsService,
    private readonly messageService: MessageService,
    private readonly miscsService: MiscService,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.reloadList$
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.miscsService.startRequest();
        }),
        switchMap(() =>
          this.medicalReportsService.getList(this.limit, this.page, this.sort, this.search).pipe(
            catchError((error: any) => {
              this.data.set([]);
              this.totalRows.set(0);
              this.messageService.add({
                life: 5000,
                key: 'message',
                severity: 'error',
                summary: 'Error cargando la lista de reportes médicos',
                detail: error?.error?.message || error.message
              });
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
          this.messageService.add({ life: 5000, key: 'message', severity: 'warn', summary: 'No se encontraron reportes médicos', detail: '' });
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

  private getRecordDescription(id: string | null): string {
    if (!id) {
      return 'el registro seleccionado';
    }

    const row = this.data().find((item) => item?.id === id);
    if (!row) {
      return `el registro con ID ${id}`;
    }

    const candidateFields = this.columns.map((column) => column.field).filter((field) => field !== 'id' && field !== 'active');
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
            this.medicalReportsService.disable(id).subscribe(
              () => {
                this.listTable();
                this.messageService.add({ severity: 'success', key: 'message', summary: 'Operación exitosa', life: 3000 });
              },
              (error) => {
                this.messageService.add({
                  life: 5000,
                  key: 'message',
                  severity: 'error',
                  summary: 'Error al eliminar el reporte médico',
                  detail: error?.error?.message || error.message
                });
              }
            );
            break;
        }
      }
    });
  }

  deleteSelected() {
    this.confirmDisplay = true;
    const requests: any[] = [];
    const selectedIds = this.ids();
    for (let i = 0; i < selectedIds.length; i++) {
      const req = this.medicalReportsService.disable(selectedIds[i]).pipe(
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
