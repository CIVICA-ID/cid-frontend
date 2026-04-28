import { RealScanService } from "@/services/realscan.service";
import { Component, inject } from "@angular/core";
import { ButtonModule } from "primeng/button";

// Botones reutilizables para inicializar SDK y dispositivo Realscan
@Component({
    selector: 'app-sdk-init-buttons',
    standalone: true,
    imports: [ButtonModule],
    template: `
        <!-- SDK del dispositivo -->
        @if (!realScanService.sdkInitialized()) {
            <button pButton pRipple type="button"
                label="Inicializar SDK"
                icon="pi pi-bolt"
                class="w-full mb-3"
                [disabled]="realScanService.loading()"
                [loading]="realScanService.loading()"
                (click)="initSDK()">
            </button>
        }
        @if (realScanService.sdkInitialized() && !realScanService.deviceHandle()) {
            <button pButton pRipple type="button"
                label="Inicializar Dispositivo"
                icon="pi pi-desktop"
                class="p-button-success w-full mb-3"
                [disabled]="realScanService.loading()"
                [loading]="realScanService.loading()"
                (click)="initDevice()">
            </button>
        }
    `
})
export class SdkInitButtonsComponent{
    readonly realScanService = inject(RealScanService);

    initSDK(): void{
        this.realScanService.initSDK().subscribe({
            error: e => console.error('Error inicializando SDK: ', e)
        });
    }
    initDevice(): void{
        this.realScanService.initDevice(0).subscribe({
            error: e => console.error('Error inicializando dispositivo', e)
        });
    }
}
