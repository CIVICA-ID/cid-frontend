import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { PageTitleComponent } from '@shared/page-title/page-title.component';
import { NgxDatatableModule } from '@siemens/ngx-datatable';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, icons } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { FormsModule } from "@angular/forms";
import { EmployeeService } from "../module/service";
import { ModalService } from '../../../Component/modals/modal.service';
import { ToastrService } from 'ngx-toastr';
import { MDModalModule } from "../../../Component/modals/public_api";

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    PageTitleComponent,
    NgxDatatableModule,
    LucideAngularModule,
    MDModalModule,
    RouterLink,
    FormsModule,
    FlatpickrModule
  ],
  templateUrl: './template.html',

  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) },
    EmployeeService,
    FlatpickrDefaults
  ]
})
export class ListComponent implements OnInit {
  employes: any[] = [];
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  searchText: string = '';
  nameSearch: string = '';

  // For delete confirmation
  selectedEmployeeId: number | null = null;

  // Excel download functionality
  excelFilters = {
    dateFrom: '',
    dateTo: ''
  };
  dateRangePicker: any = [];
  flatpickrOptions: any = {};
  isDownloadingAltas: boolean = false;
  isDownloadingBajas: boolean = false;
  isDownloadingReingresos: boolean = false;
  isDownloadingDomicilios: boolean = false;
  isDownloadingDatosEmpleado: boolean = false;

  private employeeService = inject(EmployeeService);
  private modalService = inject(ModalService);
  private toastr = inject(ToastrService);

  columns = [
    { name: 'ITS', prop: 'its' },
    { name: 'Nombre completo', prop: 'nombreCompleto' },
    { name: 'NSS', prop: 'nss' },
    { name: 'RFC', prop: 'rfc' },
    { name: 'CURP', prop: 'curp' },
    { name: 'Estatus', prop: 'estatus' },
    { name: 'Contratación', prop: 'contratacion' },
    { name: 'Ingreso', prop: 'fechaDeIngreso' },
    { name: 'Acción', prop: 'action' }
  ];

  ngOnInit(): void {
    this.initializeFlatpickr();
    this.loadEmployees(this.currentPage, this.searchText, this.nameSearch);
  }

  initializeFlatpickr(): void {
    console.log('Inicializando opciones de Flatpickr');
    this.flatpickrOptions = {
      mode: 'range',
      dateFormat: 'Y-m-d',
      locale: Spanish,
      altInput: true,
      altFormat: 'd/m/Y',
      allowInput: true
    };
  }

  onDateRangeChange(value: any): void {
    console.log('onDateRangeChange disparado con valor:', value);
    console.log('Tipo del valor:', typeof value);

    // Si viene como string con formato "2026-01-01 a 2026-01-03"
    if (typeof value === 'string' && value.includes(' a ')) {
      const dates = value.split(' a ').map((d: string) => d.trim());
      this.excelFilters.dateFrom = dates[0];
      this.excelFilters.dateTo = dates[1];
      console.log('Fechas parseadas desde string:', this.excelFilters);
    }
    // Si viene como string con formato "2026-01-01 to 2026-01-03"
    else if (typeof value === 'string' && value.includes(' to ')) {
      const dates = value.split(' to ').map((d: string) => d.trim());
      this.excelFilters.dateFrom = dates[0];
      this.excelFilters.dateTo = dates[1];
      console.log('Fechas parseadas desde string (to):', this.excelFilters);
    }
    // Si viene como array de fechas
    else if (Array.isArray(value) && value.length === 2) {
      this.excelFilters.dateFrom = this.formatDate(value[0]);
      this.excelFilters.dateTo = this.formatDate(value[1]);
      console.log('Fechas parseadas desde array:', this.excelFilters);
    }
    // Si viene como array de una fecha
    else if (Array.isArray(value) && value.length === 1) {
      this.excelFilters.dateFrom = this.formatDate(value[0]);
      this.excelFilters.dateTo = '';
      console.log('Fecha única seleccionada:', this.excelFilters);
    }
    // Si está vacío
    else if (!value || value === '') {
      this.excelFilters.dateFrom = '';
      this.excelFilters.dateTo = '';
      console.log('Fechas limpiadas');
    }
  }

  async loadEmployees(page: number, search: string = '', nameSearch: string = '') {
    try {
      const params = {
        page,
        pageSize: this.itemsPerPage,
        search: search.trim() !== '' ? search : undefined,
        name: nameSearch.trim() !== '' ? nameSearch : undefined,
        orderBy : 'id:desc'
      };

      const response = await this.employeeService.getList(params);

      if (response?.success && response?.data?.data) {
        this.employes = response.data.data;
        this.totalItems = response.data.total || 0;
      } else {
        this.employes = [];
        this.totalItems = 0;
      }

      document.getElementById('elmLoader')?.classList.add('d-none');
    } catch (error) {
      console.error('Error loading employees:', error);
      this.employes = [];
      this.totalItems = 0;
      document.getElementById('elmLoader')?.classList.add('d-none');
    }
  }

  getEndIndex() {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  // Pagination
  onPageChange(pageNumber: number): void {
    this.currentPage = pageNumber;
    this.loadEmployees(this.currentPage, this.searchText, this.nameSearch);
  }

  onSearch() {
    this.currentPage = 1;
    this.loadEmployees(this.currentPage, this.searchText, this.nameSearch);
  }

  clearSearch() {
    this.searchText = '';
    this.nameSearch = '';
    this.onSearch();
  }

  // Pagination methods
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToFirstPage(): void {
    if (this.currentPage !== 1) {
      this.currentPage = 1;
      this.loadEmployees(this.currentPage, this.searchText, this.nameSearch);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadEmployees(this.currentPage, this.searchText, this.nameSearch);
    }
  }

  goToNextPage(): void {
    const totalPages = this.getTotalPages();
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.loadEmployees(this.currentPage, this.searchText, this.nameSearch);
    }
  }

  goToLastPage(): void {
    const totalPages = this.getTotalPages();
    if (this.currentPage !== totalPages) {
      this.currentPage = totalPages;
      this.loadEmployees(this.currentPage, this.searchText, this.nameSearch);
    }
  }

  // Delete functionality
  deleteEmployee(employeeId: number) {
    this.selectedEmployeeId = employeeId;
    this.modalService.open('deleteConfirmModal');
  }

  async confirmDelete() {
    if (this.selectedEmployeeId) {
      try {
        await this.employeeService.delete(this.selectedEmployeeId);
        this.toastr.success('El registro se eliminó correctamente.', 'Eliminación');

        // Reload the employee list
        this.loadEmployees(this.currentPage, this.searchText, this.nameSearch);

        // Reset selected employee
        this.selectedEmployeeId = null;
      } catch (error) {
        console.error('Error deleting employee:', error);
        this.toastr.error('No se pudo eliminar el registro. Inténtalo de nuevo.', 'Error');
      } finally {
        this.modalService.close('deleteConfirmModal');
      }
    }
  }

  // Excel download functionality
  async downloadExcelAltas(): Promise<void> {
    console.log('Iniciando descarga de Excel de Altas con filtros:', this.dateRangePicker);

    if (!this.validateExcelFilters()) return;

    this.isDownloadingAltas = true;
    try {
      const filters = {
        dateFrom: this.excelFilters.dateFrom,
        dateTo: this.excelFilters.dateTo
      };

      const blob = await this.employeeService.downloadExcelAltas(filters);
      this.downloadBlob(blob, `altas_imss_${this.getFormattedDate()}.xlsx`);
      this.toastr.success('Archivo Excel de Altas descargado exitosamente', 'Descarga');
    } catch (error) {
      console.error('Error downloading Excel Altas:', error);
      this.toastr.error('Error al descargar el archivo Excel de Altas', 'Error');
    } finally {
      this.isDownloadingAltas = false;
    }
  }

  async downloadExcelBajas(): Promise<void> {
    if (!this.validateExcelFilters()) return;

    this.isDownloadingBajas = true;
    try {
      const filters = {
        dateFrom: this.excelFilters.dateFrom,
        dateTo: this.excelFilters.dateTo
      };

      const blob = await this.employeeService.downloadExcelBajas(filters);
      this.downloadBlob(blob, `bajas_imss_${this.getFormattedDate()}.xlsx`);
      this.toastr.success('Archivo Excel de Bajas descargado exitosamente', 'Descarga');
    } catch (error) {
      console.error('Error downloading Excel Bajas:', error);
      this.toastr.error('Error al descargar el archivo Excel de Bajas', 'Error');
    } finally {
      this.isDownloadingBajas = false;
    }
  }

  async downloadExcelReingresos(): Promise<void> {
    if (!this.validateExcelFilters()) return;

    this.isDownloadingReingresos = true;
    try {
      const filters = {
        dateFrom: this.excelFilters.dateFrom,
        dateTo: this.excelFilters.dateTo
      };

      const blob = await this.employeeService.downloadExcelReingresos(filters);
      this.downloadBlob(blob, `reingresos_imss_${this.getFormattedDate()}.xlsx`);
      this.toastr.success('Archivo Excel de Reingresos descargado exitosamente', 'Descarga');
    } catch (error) {
      console.error('Error downloading Excel Reingresos:', error);
      this.toastr.error('Error al descargar el archivo Excel de Reingresos', 'Error');
    } finally {
      this.isDownloadingReingresos = false;
    }
  }

  async downloadExcelDomicilios(): Promise<void> {
    this.isDownloadingDomicilios = true;
    try {
      // No se envían filtros, traerá toda la información
      const blob = await this.employeeService.downloadExcelDomicilios({});
      this.downloadBlob(blob, `domicilios_telefonos_${this.getFormattedDate()}.xlsx`);
      this.toastr.success('Archivo Excel de Domicilios y Teléfonos descargado exitosamente', 'Descarga');
    } catch (error) {
      console.error('Error downloading Excel Domicilios:', error);
      this.toastr.error('Error al descargar el archivo Excel de Domicilios y Teléfonos', 'Error');
    } finally {
      this.isDownloadingDomicilios = false;
    }
  }

  async downloadExcelDatosEmpleado(): Promise<void> {
    this.isDownloadingDatosEmpleado = true;
    try {
      // No se envían filtros, traerá toda la información
      const blob = await this.employeeService.downloadExcelDatosEmpleado({});
      this.downloadBlob(blob, `datos_empleado_${this.getFormattedDate()}.xlsx`);
      this.toastr.success('Archivo Excel de Datos del Empleado descargado exitosamente', 'Descarga');
    } catch (error) {
      console.error('Error downloading Excel Datos Empleado:', error);
      this.toastr.error('Error al descargar el archivo Excel de Datos del Empleado', 'Error');
    } finally {
      this.isDownloadingDatosEmpleado = false;
    }
  }

  private validateExcelFilters(): boolean {
    console.log('Validando filtros de Excel:', this.excelFilters);
    if (!this.excelFilters.dateFrom && !this.excelFilters.dateTo) {
      this.toastr.warning('Por favor selecciona al menos una fecha para filtrar', 'Filtros requeridos');
      return false;
    }

    if (this.excelFilters.dateFrom && this.excelFilters.dateTo) {
      const dateFrom = new Date(this.excelFilters.dateFrom);
      const dateTo = new Date(this.excelFilters.dateTo);

      if (dateFrom > dateTo) {
        this.toastr.warning('La fecha "Desde" no puede ser mayor que la fecha "Hasta"', 'Fechas inválidas');
        return false;
      }
    }

    return true;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private getFormattedDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}`;
  }

  clearExcelFilters(): void {
    this.excelFilters = {
      dateFrom: '',
      dateTo: ''
    };
    this.dateRangePicker = [];
  }

  hasExcelFilters(): boolean {
    return !!(this.excelFilters.dateFrom || this.excelFilters.dateTo);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
