import { CaptureMode, Segment, SegmentedFinger } from "@/api/realscan";
import { All_FINGERS, assignSlapFingersToCapture, buildImageDataUrl, CaptureQueueItem, EnrollMode, FingerKey, FULL_CAPTURE_STEP_INDICATORS, FULL_CAPTURE_STEP_ORDER, FullCaptureStep, LEFT_FINGER_DEFINITIONS, LEFT_SLAP_FINGER_NAMES, RIGHT_FINGER_DEFINITIONS, RIGHT_SLAP_FINGER_NAMES, rotateImageFormat, TenFingerCapture } from "@/components/people/models/fingerprint.models";
import { RealScanService } from "@/services/realscan.service";
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";


@Component({
    selector: 'app-fingerprint-enroll-dialog',
    templateUrl: './fingerprint-enroll-dialog.component.html',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule]
})
export class FingerprintEnrollDialogComponent{
    // Emite el resultado de la captura cuando se completa
    @Output() fingersEnrolled = new EventEmitter<TenFingerCapture>();

    public realScanService = inject(RealScanService);
    //Estado del dialog
    enrollDialogVisible: boolean = false
    enrollMode: EnrollMode = 'select';

    currentFullStep: FullCaptureStep = 'left-four';
    leftFourFingers: SegmentedFinger[] = [];
    leftThumbFinger: SegmentedFinger | null = null;
    rightFourFingers: SegmentedFinger[] = [];
    rightThumbFinger: SegmentedFinger | null = null;
    leftThumbImageFormat: string = 'bmp';
    rightThumbImageFormat: string = 'bmp';

    selectedFingerKeys: Set<FingerKey> = new Set();
    captureQueue: CaptureQueueItem[] = [];
    currentQueueIndex: number = 0;
    currentQueueImageFormat: string = 'bmp';

    readonly leftFingerDefinitions = LEFT_FINGER_DEFINITIONS;
    readonly rightFingerDefinitions = RIGHT_FINGER_DEFINITIONS;
    readonly fullStepIndicators = FULL_CAPTURE_STEP_INDICATORS;
    readonly leftSlapFingerNames = LEFT_SLAP_FINGER_NAMES;
    readonly rightSlapFingerNames = RIGHT_SLAP_FINGER_NAMES;

    openEnrollDialog(): void{
        this.enrollMode = 'select';
        this.resetAllCaptureState();
        this.realScanService.clearError();
        this.enrollDialogVisible = true;
    }
    closeEnrollDialog(): void{
        this.enrollDialogVisible = false;
        if(this.realScanService.deviceHandle()) this.realScanService.exitAllDevices().subscribe();
    }
    selectFullMode(): void{
        this.enrollMode = 'full';
        this.resetFullModeState();
    }
    chooseCustomMode(): void{
        this.enrollMode = 'custom';
        this.selectedFingerKeys = new Set();
    }
    returnModeSelection(): void{
        this.enrollMode = 'select';
        this.resetAllCaptureState();
        this.realScanService.clearError();
    }
    initSDK(): void {
        this.realScanService.initSDK().subscribe({
            error: e => console.error(e)
        });
    }
    initDevice(): void{
        this.realScanService.initDevice(0).subscribe({ error: e => console.error(e)});
    }

    captureLeftFour(): void{
        this.leftFourFingers = [];
        this.realScanService.clearError();
        this.realScanService.quickCapture(CaptureMode.FLAT_LEFT_FOUR_FINGERS, 15000, Segment.ENABLED)
        .subscribe({
            next: r => {
                if(!r.success){
                    this.realScanService.lastError.set(r.message || 'Error');
                    return;
                }
                if(r.fingers?.length){
                    this.leftFourFingers = r.fingers;
                } else{
                    this.realScanService.lastError.set('No se detectaron dedos');
                }
            },
            error: e => console.error('Error en captura de 4 dedos izquierdos', e)
        });
    }
    captureRightFour(): void{
        this.rightFourFingers = [];
        this.realScanService.clearError();
        this.realScanService.quickCapture(CaptureMode.FLAT_RIGHT_FOUR_FINGERS, 15000, Segment.ENABLED)
        .subscribe({
            next: r => {
                if(!r.success){
                    this.realScanService.lastError.set(r.message || 'Error');
                    return;
                }
                if(r.fingers?.length){
                    this.rightFourFingers = r.fingers;
                }else{
                    this.realScanService.lastError.set('No se detectaron dedos');
                }
            },
            error: e => console.error('Error en captura de 4 dedos derechos', e)
        });
    }
    captureLeftThumb(): void{
        this.captureThumbFinger('left');
    }
    captureRightThumb(): void{
        this.captureThumbFinger('right');
    }
    private captureThumbFinger(hand: 'left' | 'right'): void{
        if(hand === 'left'){
            this.leftThumbFinger = null;
            this.leftThumbImageFormat = 'bmp';
        }else {
            this.rightThumbFinger = null;
            this.rightThumbImageFormat = 'bmp';
        }
        this.realScanService.clearError();

        this.realScanService.quickCapture(CaptureMode.FLAT_SINGLE_FINGER, 10000, Segment.ENABLED)
        .subscribe({
            next: r => {
                if(!r.success){
                    this.realScanService.lastError.set(r.message || 'Error en Captura');
                    return;
                }
                const segmentedFinger = this.extractSingleFinger(r);
                if(segmentedFinger){
                    if(hand === 'left')
                        this.leftThumbFinger = segmentedFinger;
                    else this.rightThumbFinger = segmentedFinger;
                } else{
                    this.realScanService.lastError.set('No se recibio imagen del pulgar');
                }
            },
            error: e => console.error('Error captura pulgar: ', e),
        });
    }
    acceptLeftFourFingers(): void{
        if(this.leftFourFingers.length > 0){
            this.currentFullStep = 'left-thumb';
            this.realScanService.clearError();
        }
    }
    acceptLeftThumb(): void{
        if(this.leftThumbFinger){
            this.currentFullStep = 'right-four';
            this.realScanService.clearError();
        }
    }
    acceptRightFourFingers(): void{
        if(this.rightFourFingers.length > 0){
            this.currentFullStep = 'right-thumb';
            this.realScanService.clearError();
        }
    }
    retakeLeftFourFingers(): void{
        this.leftFourFingers = [];
        this.realScanService.clearError();
    }
    retakeLeftThumb(): void{
        this.leftThumbFinger = null;
        this.leftThumbImageFormat = 'bmp';
        this.realScanService.clearError();
    }
    retakeRightFourFingers(): void{
        this.rightFourFingers = [];
        this.realScanService.clearError();
    }
    retakeRightThumb(): void{
        this.rightThumbFinger = null;
        this.rightThumbImageFormat = 'bmp';
        this.realScanService.clearError();
    }
    confirmFullCaptureAndFinish(): void{
        if(this.leftFourFingers.length < 1 || !this.leftThumbFinger || this.rightFourFingers.length < 1 || !this.rightThumbFinger){
            this.realScanService.lastError.set('Complete todos los pasos');
            return;
        }
        const capturedFingers = assignSlapFingersToCapture(this.leftFourFingers, this.leftThumbFinger, this.rightFourFingers, this.rightThumbFinger);

        this.fingersEnrolled.emit(capturedFingers);
        this.closeEnrollDialog;
    }

    getLeftThumbImageUrl(): string | null {
        return this.leftThumbFinger ? buildImageDataUrl(this.leftThumbFinger.imageBase64, this.leftThumbImageFormat) : null;
    }
    getRightThumbImageUrl(): string | null {
        return this.rightThumbFinger ? buildImageDataUrl(this.rightThumbFinger.imageBase64, this.rightThumbImageFormat) : null;
    }
    onLeftThumbImageError(): void {
        this.leftThumbImageFormat = rotateImageFormat(this.leftThumbImageFormat);
    }
    onRightThumbImageError(): void {
        this.rightThumbImageFormat = rotateImageFormat(this.rightThumbImageFormat);
    }

    isFullStepCompleted(step: string): boolean {
        return FULL_CAPTURE_STEP_ORDER.indexOf(step as FullCaptureStep) < FULL_CAPTURE_STEP_ORDER.indexOf(this.currentFullStep);
    }
    toggleFingerSelection(fingerKey: FingerKey): void {
        if (this.selectedFingerKeys.has(fingerKey)) {
            this.selectedFingerKeys.delete(fingerKey);
        } else {
            this.selectedFingerKeys.add(fingerKey);
        }
    }
    isFingerSelected(fingerKey: FingerKey): boolean {
        return this.selectedFingerKeys.has(fingerKey);
    }
    selectAllFingers(): void {
        this.selectedFingerKeys = new Set(All_FINGERS.map(finger => finger.key));
    }
    clearFingerSelection(): void {
        this.selectedFingerKeys = new Set();
    }
    startCustomCapture(): void {
        if (this.selectedFingerKeys.size === 0) {
            this.realScanService.lastError.set('Selecciona al menos un dedo.');
            return;
        }
        this.captureQueue = All_FINGERS
            .filter(finger => this.selectedFingerKeys.has(finger.key))
            .map(finger => ({ finger }));
        this.currentQueueIndex = 0;
        this.currentQueueImageFormat = 'bmp';
        this.realScanService.clearError();
    }
    getCurrentQueueItem(): CaptureQueueItem | null {
        return this.captureQueue[this.currentQueueIndex] ?? null;
    }
    getCurrentQueueImageUrl(): string | null {
        const currentItem = this.getCurrentQueueItem();
        if (!currentItem?.captured) return null;
        return buildImageDataUrl(currentItem.captured.imageBase64, this.currentQueueImageFormat);
    }
    onCurrentQueueImageError(): void {
        this.currentQueueImageFormat = rotateImageFormat(this.currentQueueImageFormat);
    }
    captureCurrentQueueFinger(): void {
        const currentItem = this.getCurrentQueueItem();
        if (!currentItem) return;

        this.updateCurrentQueueCapture(undefined);
        this.currentQueueImageFormat = 'bmp';
        this.realScanService.clearError();

        this.realScanService.quickCapture(CaptureMode.FLAT_SINGLE_FINGER, 12000, Segment.ENABLED).subscribe({
            next: response => {
                if (!response.success) { this.realScanService.lastError.set(response.message || 'Error en captura'); return; }
                const segmentedFinger = this.extractSingleFinger(response, currentItem.finger.label);
                if (segmentedFinger) { this.updateCurrentQueueCapture(segmentedFinger); }
                else { this.realScanService.lastError.set('No se recibió imagen.'); }
            },
            error: error => console.error('Error captura dedo:', error),
        });
    }
    retakeCurrentQueueFinger(): void {
        this.updateCurrentQueueCapture(undefined);
        this.currentQueueImageFormat = 'bmp';
        this.realScanService.clearError();
    }

    acceptCurrentQueueFinger(): void {
        const currentItem = this.captureQueue[this.currentQueueIndex];
        if (!currentItem?.captured) return;

        if (this.currentQueueIndex + 1 < this.captureQueue.length) {
            this.currentQueueIndex++;
            this.currentQueueImageFormat = 'bmp';
            this.realScanService.clearError();
        } else {
            this.finishCustomCapture();
        }
    }
    private extractSingleFinger(response: any, fingerLabel: string = 'Thumb'): SegmentedFinger | null {
        if (response.fingers?.length) return response.fingers[0];
        if (response.imageBase64) {
            return {
                fingerIndex: 1,
                fingerType: 0,
                fingerTypeName: fingerLabel,
                width: response.width ?? 0,
                height: response.height ?? 0,
                imageBase64: response.imageBase64,
            };
        }
        return null;
    }
    private updateCurrentQueueCapture(captured: SegmentedFinger | undefined): void {
        this.captureQueue = this.captureQueue.map((item, index) => index === this.currentQueueIndex ? { ...item, captured } : item);
    }
    private finishCustomCapture(): void {
        const capturedFingers: TenFingerCapture = {};
        for (const item of this.captureQueue) {
            if (item.captured) {
                (capturedFingers as any)[item.finger.key] = item.captured.imageBase64;
            }
        }
        this.fingersEnrolled.emit(capturedFingers);
        this.closeEnrollDialog();
    }
    private resetFullModeState(): void {
        this.currentFullStep = 'left-four';
        this.leftFourFingers = [];
        this.leftThumbFinger = null;
        this.rightFourFingers = [];
        this.rightThumbFinger = null;
        this.leftThumbImageFormat = 'bmp';
        this.rightThumbImageFormat = 'bmp';
    }
    private resetAllCaptureState(): void {
        this.resetFullModeState();
        this.selectedFingerKeys = new Set();
        this.captureQueue = [];
        this.currentQueueIndex = 0;
        this.currentQueueImageFormat = 'bmp';
    }
}
