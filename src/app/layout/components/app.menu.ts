import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: '[app-menu]',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: any[] = [
        {
            label: 'Administración',
            icon: 'pi pi-home',
            items: [
                {
                    label: 'Roles',
                    icon: 'pi pi-user-edit',
                    routerLink: ['/roles']
                },
                {
                    label: 'Módulos',
                    icon: 'pi pi-box',
                    routerLink: ['/modules']
                },
                {
                    label: 'Usuarios',
                    icon: 'pi pi-user',
                    routerLink: ['/users']
                },
                {
                    label: 'Cédulas',
                    icon: 'pi pi-id-card',
                    routerLink: ['/staff']
                },
                {
                    label: 'Sucursales',
                    icon: 'pi pi-building',
                    routerLink: ['/branches']
                }
            ]
        },
        { separator: true },
        {
            label: 'Apps',
            icon: 'pi pi-th-large',
            items: [
                {
                    label: 'Servicios',
                    icon: 'pi pi-fw pi-building-columns',
                    routerLink: ['/services']
                },
                {
                    label: 'Juez',
                    icon: 'pi pi-fw pi-comments',
                    routerLink: ['/court-entry']
                },
                {
                    label: 'Reportes médicos',
                    icon: 'pi pi-briefcase',
                    routerLink: ['/medical-reports']
                },
                {
                    label: 'Reportes psicosociales',
                    icon: 'pi pi-book',
                    routerLink: ['/psychosocial-reports']
                },
                {
                    label: 'Estadías en celda',
                    icon: 'pi pi-inbox',
                    routerLink: ['/cell-stays']
                },
                {
                    label: 'Pertenencias',
                    icon: 'pi pi-briefcase',
                    routerLink: ['/belongings']
                },
                {
                    label: 'Boletas de libertad',
                    icon: 'pi pi-ticket',
                    routerLink: ['/freedom-tickets']
                },
                {
                    label: 'Seguimiento',
                    icon: 'pi pi-eye',
                    routerLink: ['/seguimiento']
                },
            ]
        },
    ];
}
