import { CaptureMode, Segment, SegmentedFinger } from "@/api/realscan";
import { All_FINGERS, assignFingersToCapture, assignSlapFingersToCapture, assignThumbsToCapture, buildGroups, buildImageDataUrl, CaptureGroup, CaptureQueueItem, describeGroups, EnrollMode, FingerKey, FULL_CAPTURE_STEP_INDICATORS, FULL_CAPTURE_STEP_ORDER, FullCaptureStep, getGroupStyle, GroupStyle, LEFT_FALLBACK_ORDER, LEFT_FINGER_DEFINITIONS, LEFT_SLAP_FINGER_NAMES, RIGHT_FALLBACK_ORDER, RIGHT_FINGER_DEFINITIONS, RIGHT_SLAP_FINGER_NAMES, rotateImageFormat, SDK_FINGER_TYPE_MAP, TenFingerCapture } from "@/components/people/models/fingerprint.models";
import { RealScanService } from "@/services/realscan.service";
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, output, Output, input, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { SdkInitButtonsComponent } from "@/components/people/shared/sdk-init-buttons.component";

@Component({
    selector: 'app-fingerprint-enroll-dialog',
    templateUrl: './fingerprint-enroll-dialog.component.html',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule, SdkInitButtonsComponent]
})
export class FingerprintEnrollDialogComponent{
    // Emite el resultado de la captura cuando se completa
    fingersEnrolled = output<TenFingerCapture>();
    // Dedos ya capturados previamente para deshabilitar seleccion
    alreadyEnrolledFingers = input<TenFingerCapture>({});

    readonly realScanService = inject(RealScanService);
    private readonly destroyRef = inject(DestroyRef);
    //Estado del dialog
    enrollDialogVisible: boolean = false
    enrollMode: EnrollMode = 'select';
    // Modo completo
    currentFullStep: FullCaptureStep = 'left-four';
    leftFourFingers: SegmentedFinger[] = [];
    rightFourFingers: SegmentedFinger[] = [];
    bothThumbs: SegmentedFinger[] = [];
    bothThumbsImageFormat: string = 'bmp';
    // Modo personalizado
    selectedFingerKeys = new Set<FingerKey>();
    captureGroups: CaptureGroup[] = [];
    currentGroupIndex: number = 0;
    groupSummary: string = '';
    // Constantes para template
    readonly leftFingerDefinitions = LEFT_FINGER_DEFINITIONS;
    readonly rightFingerDefinitions = RIGHT_FINGER_DEFINITIONS;
    readonly fullStepIndicators = FULL_CAPTURE_STEP_INDICATORS;
    readonly leftSlapFingerNames = LEFT_SLAP_FINGER_NAMES;
    readonly rightSlapFingerNames = RIGHT_SLAP_FINGER_NAMES;
    // Dialog
    openEnrollDialog(): void{
        this.enrollMode = 'select';
        this.resetAllCaptureState();
        this.realScanService.clearError();
        this.enrollDialogVisible = true;
    }
    closeEnrollDialog(): void{
        this.enrollDialogVisible = false;
        if(this.realScanService.deviceHandle()) {
            this.realScanService.exitDevice()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe();
        }
    }
    // Seleccion de modo
    selectFullMode(): void{
        this.enrollMode = 'full';
        this.resetFullModeState();
    }
    chooseCustomMode(): void{
        this.enrollMode = 'custom';
        this.selectedFingerKeys = new Set();
        this.captureGroups = [];
        this.currentGroupIndex = 0;
    }
    returnModeSelection(): void{
        this.enrollMode = 'select';
        this.resetAllCaptureState();
        this.realScanService.clearError();
    }
    // Modo completo de captura
    captureLeftFour(): void{
        this.leftFourFingers = [];
        this.captureGroup(CaptureMode.FLAT_LEFT_FOUR_FINGERS, 15000,
            fingers => {
                this.leftFourFingers = fingers;
            }
        );
    }
    captureRightFour(): void{
        this.rightFourFingers = [];
        this.captureGroup(CaptureMode.FLAT_RIGHT_FOUR_FINGERS, 15000,
            fingers => {
                this.rightFourFingers = fingers;
            }
        );
    }
    captureBothThumbs(): void{
        this.bothThumbs = [];
        this.bothThumbsImageFormat = 'bmp';
        this.captureGroup(CaptureMode.FLAT_TWO_FINGERS_EX, 12000,
            fingers => {
                this.bothThumbs = fingers;
            }
        );
    }
    acceptLeftFourFingers(): void{
        if(this.leftFourFingers.length > 0){
            this.currentFullStep = 'right-four';
            this.realScanService.clearError();
        }
    }
    acceptRightFourFingers(): void{
        if(this.rightFourFingers.length > 0){
            this.currentFullStep = 'two-thumbs';
            this.realScanService.clearError();
        }
    }
    retakeLeftFourFingers(): void{
        this.leftFourFingers = [];
        this.realScanService.clearError();
    }
    retakeRightFourFingers(): void{
        this.rightFourFingers = [];
        this.realScanService.clearError();
    }
    retakeBothThumbs(): void{
        this.bothThumbs = [];
        this.bothThumbsImageFormat = 'bmp';
        this.realScanService.clearError();
    }
    confirmFullCaptureAndFinish(): void{
        if(!this.leftFourFingers.length || !this.rightFourFingers.length || !this.bothThumbs.length){
            this.realScanService.lastError.set('Complete todos los pasos');
            return;
        }
        // Se reutiliza funcion
        const capturedFingers = assignSlapFingersToCapture(this.leftFourFingers, this.rightFourFingers, this.bothThumbs);

        this.fingersEnrolled.emit(capturedFingers);
        this.closeEnrollDialog();
    }
    isFullStepCompleted(step: string): boolean {
        return FULL_CAPTURE_STEP_ORDER.indexOf(step as FullCaptureStep) < FULL_CAPTURE_STEP_ORDER.indexOf(this.currentFullStep);
    }
    // Modo personalizado de seleccion
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
    isFingerAlreadyEnrolled(fingerKey: FingerKey): boolean{
        return !!this.alreadyEnrolledFingers()[fingerKey];
    }
    selectAllFingers(): void {
        this.selectedFingerKeys = new Set(All_FINGERS.map(finger => finger.key));
    }
    clearFingerSelection(): void {
        this.selectedFingerKeys = new Set();
    }
    // Grupos de captura en modo personalizado
    startCustomCapture(): void {
        if (this.selectedFingerKeys.size === 0) {
            this.realScanService.lastError.set('Selecciona al menos un dedo.');
            return;
        }
        console.log('Dedos seleccionados:', [...this.selectedFingerKeys]);

        this.captureGroups = buildGroups(this.selectedFingerKeys);
        this.currentGroupIndex = 0;
        this.groupSummary = describeGroups(this.captureGroups);
        //Verificar grupos generados
        console.log('Grupos generados:', this.captureGroups.map(g => ({
            type: g.type,
            label: g.label,
            captureMode: g.captureMode,
            fingers: g.fingers.map(f => f.key)
        })));
        this.realScanService.clearError();
    }
    getCurrentGroup(): CaptureGroup | null {
        return this.captureGroups[this.currentGroupIndex] ?? null;
    }
    isGroupCaptured(): boolean{
        const group = this.getCurrentGroup();
        if(!group){
            return false;
        }
        return group.type === 'single'
            ? !!group.capturedSingle
            : !!group.capturedFingers?.length;
    }
    captureCurrentGroup(): void {
        const group = this.getCurrentGroup();
        if (!group) return;

        this.updateGroupCapture(undefined, undefined);
        group.imageFormat = 'bmp';
        this.realScanService.clearError();

        const timeout = group.type === 'single' ? 12000 : 15000;
        console.log('Capturando grupo:', group.type, 'modo:', group.captureMode);

        this.realScanService.quickCapture(group.captureMode, timeout, Segment.ENABLED)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: response => {
                if(!response.success){
                    this.realScanService.lastError.set(response.message || 'Error en captura');
                    return;
                }
                if(group.type === 'single'){
                    const finger = this.extractSingleFinger(response, group.fingers[0].label);
                    if(finger){
                        this.updateGroupCapture(undefined, finger);
                    }else {
                        this.realScanService.lastError.set('No se recibio imagen');
                    }
                } else{
                    if(response.fingers?.length){
                        this.updateGroupCapture(response.fingers, undefined);
                    }else {
                        this.realScanService.lastError.set('No se detectaron dedos');
                    }
                }
            },
            error: e => console.error('Error captura grupo: ', e)
        });
    }
    retakeCurrentGroup(): void {
        this.updateGroupCapture(undefined, undefined);
        const group = this.getCurrentGroup();
        if(group) group.imageFormat = 'bmp';
        this.realScanService.clearError();
    }

    acceptCurrentGroup(): void {
        if (!this.isGroupCaptured()) return;
        if (this.currentGroupIndex + 1 < this.captureGroups.length) {
            this.currentGroupIndex++;
            this.realScanService.clearError();
        } else {
            this.finishCustomCapture();
        }
    }
    // Imagen y estilos para template
    getGroupSingleImageUrl(): string | null{
        const group = this.getCurrentGroup();
        if(!group?.capturedSingle) return null;
        return buildImageDataUrl(group.capturedSingle.imageBase64, group.imageFormat || 'bmp');
    }
    onGroupSingleImageError(): void{
        const group = this.getCurrentGroup();
        if(group) group.imageFormat = rotateImageFormat(group.imageFormat || 'bmp');
    }
    getGroupFingerNames(): string[]{
        const group = this.getCurrentGroup();
        if(!group) return [];
        if(group.type === 'left-four') return LEFT_SLAP_FINGER_NAMES;
        if(group.type === 'right-four') return RIGHT_SLAP_FINGER_NAMES;
        if(group.type === 'two-thumbs') return ['Pulgar Izq.', 'Pulgar Der.'];
        return [group.fingers[0]?.label || ''];
    }
    // Retorna los estilos del grupo actual
    get currentGroupStyle(): GroupStyle{
        return getGroupStyle(this.getCurrentGroup()?.type);
    }
    // metodo para capturar un grupo de dedos
    private captureGroup(
        mode: CaptureMode,
        timeout: number,
        onSuccess: (fingers: SegmentedFinger[]) => void
    ): void{
        this.realScanService.clearError();
        this.realScanService
        .quickCapture(mode, timeout, Segment.ENABLED)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: r => {
                if(!r.success){
                    this.realScanService.lastError.set(r.message || 'Error');
                    return;
                }
                if(r.fingers?.length){
                    onSuccess(r.fingers);
                }else{
                    this.realScanService.lastError.set('No se detectaron dedos');
                }
            },
            error: e => console.error('Error en captura: ', e)
        });
    }
    private extractSingleFinger(response: any, fingerLabel: string): SegmentedFinger | null {
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
    private updateGroupCapture(capturedFingers: SegmentedFinger[] | undefined, capturedSingle: SegmentedFinger | undefined): void {
        this.captureGroups = this.captureGroups.map((group, index) =>
            index === this.currentGroupIndex ?
        {
            ...group,
            capturedFingers,
            capturedSingle
        }
        : group);
    }
    // Finaliza captura personalizada
    private finishCustomCapture(): void {
        const capturedFingers: TenFingerCapture = {};
        for (const group of this.captureGroups) {
            if (group.type === 'single' && group.capturedSingle) {
                (capturedFingers as any)[group.fingers[0].key] = group.capturedSingle.imageBase64;
            } else if(group.type === 'left-four' && group.capturedFingers?.length){
                assignFingersToCapture(group.capturedFingers, 'left', capturedFingers);
            } else if(group.type === 'right-four' && group.capturedFingers?.length){
                assignFingersToCapture(group.capturedFingers, 'right', capturedFingers);
            } else if(group.type === 'two-thumbs' && group.capturedFingers?.length){
                assignThumbsToCapture(group.capturedFingers, capturedFingers);
            }
        }
        this.fingersEnrolled.emit(capturedFingers);
        this.closeEnrollDialog();
    }
    private resetFullModeState(): void {
        this.currentFullStep = 'left-four';
        this.leftFourFingers = [];
        this.rightFourFingers = [];
        this.bothThumbs = [];
        this.bothThumbsImageFormat = 'bmp';
    }
    private resetAllCaptureState(): void {
        this.resetFullModeState();
        this.selectedFingerKeys = new Set();
        this.captureGroups = [];
        this.currentGroupIndex = 0;
        this.groupSummary = '';
    }
}
