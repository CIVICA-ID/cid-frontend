import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { ButtonModule } from "primeng/button";


@Component({
    selector: 'app-match-result-card',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
        <div class="border-2 rounded-lg p-4 mb-4"
            [ngClass]="borderClass()">
            <div class="flex items-center gap-2 mb-3">
                <i [class]="iconClass()" class="text-xl"></i>
                <span class="font-bold text-lg" [ngClass]="titleColorClass()">
                    {{title()}}
                </span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm mb-3">
                <ng-content/>
            </div>
            <p class="text-sm text-blue-700 mb-4 font-medium">
                ¿Es la persona que busca?
            </p>
            <div class="grid grid-cols-2 gap-3">
                <button pButton pRipple type="button"
                    label="Si, es correcta"
                    icon="pi pi-check"
                    class="p-button-success"
                    [disabled]="loading()"
                    [loading]="loading()"
                    (click)="confirmed.emit(true)">
                </button>
                <button pButton pRipple type="button"
                    label="No, seguir buscando"
                    icon="pi pi-times"
                    class="p-button-danger p-button-outlined"
                    [disabled]="loading()"
                    [loading]="loading()"
                    (click)="confirmed.emit(false)">
                </button>
            </div>
        </div>
    `
})
export class MathResultCardComponent{
    title = input('Coincidencia encontrada');
    // Si se esta procesando la confirmacion
    loading = input(false);
    // Estilos
    borderClass = input('border-blue-300 bg-blue-50');
    iconClass = input('pi pi-user text-blue-600');
    titleColorClass = input('text-blue-800');
    // Emite true si confirma, false si rechaza
    confirmed = output<boolean>();
}
