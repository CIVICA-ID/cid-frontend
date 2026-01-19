import { TableTemplateComponent } from '@/components/table-template/table-template.component';
import { MiscService } from '@/services/misc.service';
import { ServicesService } from '@/services/services.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {  MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { catchError, of, forkJoin, Observable } from 'rxjs';
import { ModulesServices } from '@/services/modules.service';

@Component({
    selector: 'app-list-roles',
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
    providers: [ModulesServices, MessageService, ConfirmationService], // Providers locales
    templateUrl: './list.modules.component.html'
})
export class ListModulesComponent {
    columns = [
        {
            field: 'id',
            column: 'ID',
            columnType: 'text',
            fieldType: 'text'
        },
        {
            field: 'name',
            column: 'Nombre',
            columnType: 'text',
            fieldType: 'text'
        }
    ];
    totalRows: number = 0;
    configTable: any = {};
    data = [];
    limit: number = 10;
    search = {};
    sort: string[][] = [];
    page: number = 1;
    ids: string[] = [];
    searchTerm: string = '';
    list: Observable<any>;
    confirmDisplay: boolean = false;
    constructor(
        private moduleService: ModulesServices,
        private messageService: MessageService,
        private miscsService: MiscService,
        private confirmationService: ConfirmationService
    ) {}
    listTable(): void {
        this.miscsService.startRequest();
        this.moduleService.getList(this.limit, this.page, this.sort, this.search).subscribe({
            next: (data) => {
                if (data['meta']["totalItems"]) {
                    this.data = data['data'];
                    this.totalRows = data['meta']['totalItems'];
                    this.configTable = {
                        module: 'Módulos',
                        route: 'modules',
                        totalRows: this.totalRows
                    };
                }
                else{
                    this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error', detail: "No se encontraron módulos" });
                    this.data = [];
                    this.totalRows = 0;
                    this.configTable = {
                        module: 'Módulos',
                        route: 'modules',
                        totalRows: this.totalRows
                    };
                }
                this.miscsService.endRquest();
            },
            error: (error) => {
                this.miscsService.endRquest();
                this.data = [];
                this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error cargando la lista de módulos', detail: error.error.message });
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
        let message=deleteType==1?"los registros seleccionados":"el registro";
        // message=(deleteType)
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
                        // this.confirmDelete(id);
                        this.moduleService.disable(id)
                        .subscribe(()=>{
                            this.listTable();
                            this.messageService.add({ severity: 'success',key: 'message', summary: 'Operación exitosa', life: 3000 });
                        },
                        error=>{
                            this.messageService.add({ life:5000, key: 'message', severity: 'error', summary: "Error al eliminar el módulo", detail:error.error.message });
                        });
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
        var peticiones: any[] = [];
        for (let i = 0; i < this.ids.length; i++) {
            const ptt = this.moduleService.disable(this.ids[i]).pipe(
                catchError((error) => {
                    this.messageService.add({ life: 5000, key: 'message', severity: 'error', summary: 'Error al eliminar el registro', detail: error.message });
                    return of(null);
                })
            );
            peticiones.push(ptt);
        }
        forkJoin(peticiones).subscribe(
            (respuestas: any[]) => {
                this.messageService.add({ severity: 'success', key: 'message', summary: 'Operación exitosa', detail: 'Registro eliminados exitosamente', life: 3000 });
                this.listTable();
                this.ids = [];
            },
            (err) => {
                this.messageService.add({ severity: 'error', key: 'message', summary: 'Error al eliminar registros', detail: err.message, life: 3000 });
            }
        );
    }
}
