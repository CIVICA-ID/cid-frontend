import { CaptureMode, Segment, SegmentedFinger } from "@/api/realscan";
import { buildImageDataUrl, rotateImageFormat } from "@/components/people/models/fingerprint.models";
import { RealScanService } from "@/services/realscan.service";
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";


@Component({
    selector: 'app-fingerprint-capture-dialog',
    templateUrl: './fingerprint-capture-dialog.component.html',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule]
})
export class FingerprintCaptureDialogComponent{
    //Nombre del dedo que se esta buscando
    @Input() selectedFingerLabel: string | null = null;

    // Emite la imagen base64 del dedo capturado
    @Output() fingerCaptured = new EventEmitter<string>();

    public realScanService = inject(RealScanService);

    captureDialogVisible = false;
    capturedFinger: SegmentedFinger | null = null;
    captureImageFormat = 'bmp';

    openCaptureDialog(): void{
        this.capturedFinger = null;
        this.captureImageFormat = 'bmp';
        this.realScanService.clearError();
        this.captureDialogVisible = true;
    }

    closeCaptureDialog(): void{
        this.captureDialogVisible = false;
        if(this.realScanService.deviceHandle()){
            this.realScanService.exitDevice().subscribe();
        }
    }

    initSDK(): void {
        this.realScanService.initSDK().subscribe({
            error: e => console.error(e)
        });
    }
    initDevice(): void{
        this.realScanService.initDevice(0).subscribe({ error: e => console.error(e)});
    }

    captureSingle(): void{
        this.capturedFinger = null;
        this.captureImageFormat = 'bmp';
        this.realScanService.clearError();
        this.realScanService.quickCapture(CaptureMode.FLAT_SINGLE_FINGER, 12000, Segment.ENABLED).subscribe({
            next: (r) => {
                if(!r.success){
                    this.realScanService.lastError.set(r.message || 'Error');
                    return;
                }
                if(r.fingers.length){
                    this.capturedFinger = r.fingers[0];
                } else if(r.imageBase64){
                    this.capturedFinger = {
                        fingerIndex: 1,
                        fingerType: 0,
                        fingerTypeName: 'Tipo de dedo desconocido',
                        width: r.width ?? 0,
                        height: r.height ?? 0,
                        imageBase64: r.imageBase64
                    };
                } else{
                    this.realScanService.lastError.set('No se recibio imagen');
                }
            },
            error: e => console.error(e)
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
    getCaptureImageUrl(): string | null{
        if(!this.capturedFinger) return null;
        return buildImageDataUrl(this.capturedFinger.imageBase64, this.captureImageFormat);
    }
    onCaptureImgError(): void{
        this.captureImageFormat = rotateImageFormat(this.captureImageFormat);
    }
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
