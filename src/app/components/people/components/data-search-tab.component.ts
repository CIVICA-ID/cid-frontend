import { People } from "@/api/people";
import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TableLazyLoadEvent, TableModule } from "primeng/table";
import { SEARCH_FIELDS, SearchFieldConfig } from "../models";


@Component({
    selector: 'app-data-search-tab',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, TableModule],
    templateUrl: './data-search-tab.component.html'
})
export class DataSearchTabComponent{
    // Estado
    readonly step = input.required<number>();
    readonly searchForm = input.required<FormGroup>();
    readonly personList = input.required<People[]>();
    readonly totalRows = input.required<number>();
    readonly pageSize = input.required<number>();
    readonly pageRange = input.required<string>();

    // Eventos
    readonly searchRequested = output<void>();
    readonly addRequested = output<void>();
    readonly personSelected = output<People>();
    readonly lazyLoad = output<TableLazyLoadEvent>();
    readonly back = output<void>();

    // Constatntes
    readonly searchFields: SearchFieldConfig[] = SEARCH_FIELDS;
}
