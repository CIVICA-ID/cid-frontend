import { CaptureMode, Segment, SegmentedFinger } from "@/api/realscan";
import { buildImageDataUrl, rotateImageFormat } from "@/components/people/models/fingerprint.models";
import { RealScanService } from "@/services/realscan.service";
import { CommonModule } from "@angular/common";
import { Component, DestroyRef, EventEmitter, inject, input, Input, output, Output } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { SdkInitButtonsComponent } from "@/components/people/shared/sdk-init-buttons.component";


@Component({
    selector: 'app-fingerprint-capture-dialog',
    templateUrl: './fingerprint-capture-dialog.component.html',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule, SdkInitButtonsComponent]
})
export class FingerprintCaptureDialogComponent{
    //Nombre del dedo que se esta buscando
    selectedFingerLabel = input<string | null>(null);
    // Emite la imagen base64 del dedo capturado
    fingerCaptured = output<string>();

    readonly realScanService = inject(RealScanService);
    private readonly destroyRef = inject(DestroyRef);

    captureDialogVisible = false;
    capturedFinger: SegmentedFinger | null = null;
    captureImageFormat = 'bmp';
    // Estado Dialog
    openCaptureDialog(): void{
        this.capturedFinger = null;
        this.captureImageFormat = 'bmp';
        this.realScanService.clearError();
        this.captureDialogVisible = true;
    }

    closeCaptureDialog(): void{
        this.captureDialogVisible = false;
        if(this.realScanService.deviceHandle()){
            this.realScanService.exitDevice()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe();
        }
    }
    // Captura
    captureSingle(): void{
        this.capturedFinger = null;
        this.captureImageFormat = 'bmp';
        this.realScanService.clearError();
        this.realScanService.quickCapture(CaptureMode.FLAT_SINGLE_FINGER_EX, 12000, Segment.ENABLED)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: (response) => {
                if(!response.success){
                    this.realScanService.lastError.set(response.message || 'Error');
                    return;
                }
                if(response.fingers?.length){
                    this.capturedFinger = response.fingers[0];
                }else if(response.imageBase64){
                    this.capturedFinger = {
                        fingerIndex: 1,
                        fingerType: 0,
                        fingerTypeName: 'Tipo de dedo desconocido',
                        width: response.width ?? 0,
                        height: response.height ?? 0,
                        imageBase64: response.imageBase64
                    };
                }else {
                    this.realScanService.lastError.set('No se recibio imagen');
                }
            },
            error: e => console.error('Error en captura', e)
        });
    }
    retakeCapture(): void{
        this.capturedFinger = null;
        this.captureImageFormat = 'bmp';
        this.realScanService.clearError();
    }
    acceptCapture(): void{
        if(!this.capturedFinger?.imageBase64) return;
        this.fingerCaptured.emit(this.capturedFinger.imageBase64);
        this.closeCaptureDialog();
    }
    // Imagenes
    getCaptureImageUrl(): string | null{
        if(!this.capturedFinger) return null;
        return buildImageDataUrl(this.capturedFinger.imageBase64, this.captureImageFormat);
    }
    onCaptureImgError(): void{
        this.captureImageFormat = rotateImageFormat(this.captureImageFormat);
    }
    // Estados visuales
    getCaptureStateText(): string{
        if(this.realScanService.isCapturing()) return 'Capturando';
        if(this.capturedFinger) return 'Huella Capturada';
        if(this.realScanService.isDeviceReady()) return 'Dispositivo Listo, coloca el dedo a escanear';
        if(this.realScanService.sdkInitialized()) return 'SDK listo, inicializa el dispositivo'
        return 'Inicializa el SDK';
    }
    getCaptureStateClass(): string{
        if(this.realScanService.isCapturing()) return 'bg-yellow-100 text-yellow-700';
        if(this.capturedFinger) return 'bg-green-100 text-green-700';
        if(this.realScanService.isDeviceReady()) return 'bg-green-100 text-green-700';
        if(this.realScanService.sdkInitialized()) return 'bg-blue-100 text-blue-700';
        return 'bg-gray-100 text-gray-700';
    }
}
