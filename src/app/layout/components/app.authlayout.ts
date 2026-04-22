import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LayoutService } from '@/layout/service/layout.service';

@Component({
    selector: 'auth-layout',
    standalone: true,
    imports: [RouterModule],
    template: `
        <main>
            <router-outlet></router-outlet>
        </main>
        <button
            class="layout-config-button config-link"
            type="button"
            [attr.aria-label]="layoutService.isDarkTheme() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
            [attr.title]="layoutService.isDarkTheme() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
            (click)="layoutService.toggleDarkTheme()"
        >
            <i [class]="layoutService.isDarkTheme() ? 'pi pi-sun' : 'pi pi-moon'"></i>
        </button>
    `
})
export class AuthLayout {
    layoutService: LayoutService = inject(LayoutService);
}
