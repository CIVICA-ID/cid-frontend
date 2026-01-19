import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {  SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';
import { RippleModule } from 'primeng/ripple';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-table-template',
    templateUrl: './table-template.component.html',
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, TooltipModule, RippleModule, TagModule, DatePickerModule, FormsModule, DropdownModule],
    standalone: true,
    providers: [DatePipe]
})
export class TableTemplateComponent {
    @Input() columns = [];
    @Input() data = [];
    @Input() subColumns = [];
    @Input() configTable: any = {};
    @Input() statusArray: string[] = [];
    matchModeOptionsText: SelectItem[] = [];
    matchModeOptionsDate: SelectItem[] = [];
    @Output() paramsListChange = new EventEmitter<any>();
    @Output() idDelete = new EventEmitter<string>();
    @Output() idsDelete = new EventEmitter<string[]>();
    page: number = 1;
    limit: number = 10;
    search = {};
    sort: string[][] = [];
    selectedElements: any[] = [];
    confirmDisplaySelected: boolean = false;
    confirmDisplay: boolean = false;
    widthColumns = {};
    min_widths = {
        boolean: 90,
        date: 140,
        numeric: 230,
        text: 260
    };
    @Input()
    listOptions = [];
    // @Input() listService: Observable<any>;
    @ViewChild('dt') table: Table;
    constructor(
        private cdref: ChangeDetectorRef,
        private datePipe: DatePipe
    ) {}
    changeFilter = {
        contains: 'ilike',
        equals: 'eq',
        before: 'lte',
        after: 'gte',
        dateIs: 'eq'
    };
    //  Función auxiliar para manejar el cambio de filtro del dropdown
    onStatusFilterChange(newValue: any, filterCallback: Function) {
        filterCallback(newValue);
    }
    ngOnInit(): void {
        this.matchModeOptionsText = [
            { label: 'Contiene', value: 'contains' },
            { label: 'Es igual a', value: 'equals' }
        ];
        this.matchModeOptionsDate = [
            { label: 'Antes de', value: 'before' },
            { label: 'Después de', value: 'after' }
        ];
        this.columns.forEach((col) => {
            this.widthColumns[col.field] = this.min_widths[col.columnType];
        });
        //si no se utilizará el input de listOptions, se carga desde el servicio
        // if (this.listService != undefined) {
        //     this.listService.subscribe((data) => {
        //         if (data.length != 0) {
        //             this.listOptions = data.map((item) => {
        //                 return {
        //                     label: item.name.toUpperCase(),
        //                     value: item.name
        //                 };
        //             });
        //         }
        //     });
        // }
    }
    private formatFilterValue(filter: any): string {
        let val = filter.value;

        if (val instanceof Date) {
            val = this.datePipe.transform(val, 'yyyy-MM-dd HH:mm:00');
        }

        const mode = filter.matchMode || 'contains';
        const operator = this.changeFilter[mode] || mode;

        return `$${operator}:${val}`;
    }
    load(event: TableLazyLoadEvent) {
        this.search = {};
        this.sort = [];
        if (!event.filters) return;
        for (const field in event.filters) {
            const filterConfig = event.filters[field];
            if (!filterConfig) continue;
            // Caso 1: Es un Array (Filtros múltiples o avanzados)
            if (Array.isArray(filterConfig)) {
                const firstFilter = filterConfig[0];
                // Verificamos que el primer elemento exista y tenga valor
                if (firstFilter && firstFilter.value !== null && firstFilter.value !== undefined) {
                    this.search[field] = this.formatFilterValue(firstFilter);
                }
            }
            // Caso 2: Es un objeto único (Filtro simple)
            else if (filterConfig.value !== null && filterConfig.value!== '' && filterConfig.value !== undefined) {
                this.search[field] = this.formatFilterValue(filterConfig);
            }
        }
        let header: string[] = [];
        event.multiSortMeta.forEach(function (obj) {
            header.push(obj['field'], obj['order'] == 1 ? 'ASC' : 'DESC');
        });
        this.sort.push(header);
        this.page = event.first / event.rows + 1;
        this.limit = event.rows;
        this.paramsListChange.emit({
            page: this.page,
            limit: this.limit,
            search: this.search,
            sort: this.sort
        });
        this.cdref.detectChanges();
    }
    getPageRange(page, limit, totalRows) {
        var startIndex = 0;
        var endIndex = 0;
        if (totalRows > 0) {
            startIndex = (page - 1) * limit + 1;
            endIndex = Math.min(startIndex + limit - 1, totalRows);
        }
        return `Mostrando del ${startIndex} al ${endIndex} de ${totalRows} registros`;
    }
    getDeepValue(obj: any, path: string): any {
        return path.split('.').reduce((o, k) => (o || {})[k], obj);
    }
    getSeverity(status: string): string {
        switch (status.toUpperCase()) {
            case this.statusArray[0]:
                return 'success'; // Verde
            case this.statusArray[1]:
                return 'warning'; // Amarillo/Naranja
            case this.statusArray[2]:
                return 'danger'; // Rojo
            case this.statusArray[3]:
                return 'info'; // Azul claro
            case this.statusArray[4]:
                return 'primary'; // Azul
            default:
                return 'secondary'; // Gris (para estados desconocidos)
        }
    }
    confirmDelete(id: string) {
        this.idDelete.emit(id);
    }
    onToggleAll() {
        const ids = this.selectedElements.map((el) => el.id);
        this.idsDelete.emit(ids);
    }
}
