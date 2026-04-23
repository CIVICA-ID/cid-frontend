import { CaptureMode, Segment, SegmentedFinger } from "@/api/realscan";
import { All_FINGERS, assignSlapFingersToCapture, buildGroups, buildImageDataUrl, CaptureGroup, CaptureQueueItem, describeGroups, EnrollMode, FingerKey, FULL_CAPTURE_STEP_INDICATORS, FULL_CAPTURE_STEP_ORDER, FullCaptureStep, LEFT_FALLBACK_ORDER, LEFT_FINGER_DEFINITIONS, LEFT_SLAP_FINGER_NAMES, RIGHT_FALLBACK_ORDER, RIGHT_FINGER_DEFINITIONS, RIGHT_SLAP_FINGER_NAMES, rotateImageFormat, SDK_FINGER_TYPE_MAP, TenFingerCapture } from "@/components/people/models/fingerprint.models";
import { RealScanService } from "@/services/realscan.service";
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
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
    @Input() alreadyEnrolledFingers: TenFingerCapture = {};

    public realScanService = inject(RealScanService);
    //Estado del dialog
    enrollDialogVisible: boolean = false
    enrollMode: EnrollMode = 'select';

    currentFullStep: FullCaptureStep = 'left-four';
    leftFourFingers: SegmentedFinger[] = [];
    rightFourFingers: SegmentedFinger[] = [];
    bothThumbs: SegmentedFinger[] = [];
    bothThumbsImageFormat: string = 'bmp';

    selectedFingerKeys: Set<FingerKey> = new Set();
    captureGroups: CaptureGroup[] = [];
    currentGroupIndex: number = 0;
    groupSummary: string = '';

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
        if(this.realScanService.deviceHandle()) {
            this.realScanService.exitDevice().subscribe();
        }
    }
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
    captureBothThumbs(): void{
        this.bothThumbs = [];
        this.bothThumbsImageFormat = 'bmp';
        this.realScanService.clearError();
        this.realScanService.quickCapture(CaptureMode.FLAT_TWO_FINGERS_EX, 12000, Segment.ENABLED)
        .subscribe({
            next: r => {
                if(!r.success){
                    this.realScanService.lastError.set(r.message || 'Error en Captura');
                    return;
                }
                if(r.fingers?.length){
                    this.bothThumbs = r.fingers;
                } else {
                    this.realScanService.lastError.set('No se detectaron pulgares');
                }
            },
            error: e => console.error("Error captura pulgares: ", e)
        });
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
        if(this.leftFourFingers.length < 1 || this.rightFourFingers.length < 1 || this.bothThumbs.length < 1){
            this.realScanService.lastError.set('Complete todos los pasos');
            return;
        }
        const capturedFingers = assignSlapFingersToCapture(this.leftFourFingers, this.rightFourFingers, this.bothThumbs);

        this.fingersEnrolled.emit(capturedFingers);
        this.closeEnrollDialog();
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
    isFingerAlreadyEnrolled(fingerKey: FingerKey): boolean{
        return !!this.alreadyEnrolledFingers[fingerKey];
    }
    selectAllFingers(): void {
        this.selectedFingerKeys = new Set(All_FINGERS.map(finger => finger.key));
    }
    clearFingerSelection(): void {
        this.selectedFingerKeys = new Set();
    }
    // Grupos de captura
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
        if(group.type === 'single'){
            return !!group.capturedSingle;
        }
        return !!group.capturedFingers && group.capturedFingers.length > 0;
    }
    captureCurrentGroup(): void {
        const group = this.getCurrentGroup();
        if (!group) return;

        this.updateGroupCapture(undefined, undefined);
        group.imageFormat = 'bmp';
        this.realScanService.clearError();

        const timeout = group.type === 'single' ? 12000 : 15000;
        console.log('Capturando grupo:', group.type, 'modo:', group.captureMode);

        this.realScanService.quickCapture(group.captureMode, timeout, Segment.ENABLED).subscribe({
            next: response => {
                if (!response.success) {
                    this.realScanService.lastError.set(response.message || 'Error en captura');
                    return;
                }
                if(group.type === 'single'){
                    const segmentedFinger = this.extractSingleFinger(response, group.fingers[0].label);
                    if(segmentedFinger){
                        this.updateGroupCapture(undefined, segmentedFinger);
                    } else{
                        this.realScanService.lastError.set('No se recibio imagen');
                    }
                } else {
                    if(response.fingers?.length){
                        this.updateGroupCapture(response.fingers, undefined)
                    } else{
                        this.realScanService.lastError.set('No se detectaron dedos');
                    }
                }
            },
            error: error => console.error('Error captura dedo:', error),
        });
    }
    retakeCurrentGroup(): void {
        this.updateGroupCapture(undefined, undefined);
        const group = this.getCurrentGroup();
        if(group){
            group.imageFormat = 'bmp';
        }
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
    getGroupSingleImageUrl(): string | null{
        const group = this.getCurrentGroup();
        if(!group?.capturedSingle){
            return null;
        }
        return buildImageDataUrl(group.capturedSingle.imageBase64, group.imageFormat || 'bmp');
    }
    onGroupSingleImageError(): void{
        const group = this.getCurrentGroup();
        if(group){
            group.imageFormat = rotateImageFormat(group.imageFormat || 'bmp');
        }
    }
    getGroupFingerNames(): string[]{
        const group = this.getCurrentGroup();
        if(!group) return [];
        if(group.type === 'left-four') return LEFT_SLAP_FINGER_NAMES;
        if(group.type === 'right-four') return RIGHT_SLAP_FINGER_NAMES;
        if(group.type === 'two-thumbs') return ['Pulgar Izq.', 'Pulgar Der.'];
        return [group.fingers[0]?.label || ''];
    }
    getGroupBorderColor(): string{
        const group = this.getCurrentGroup();
        if(!group){
            return 'border-purple-300';
        }
        switch(group.type){
            case 'left-four':
                return 'border-green-300';
            case 'right-four':
                return 'border-blue-300';
            case 'two-thumbs':
                return 'border-amber-300';
            default:
                return 'border-purple-300';
        }
    }
    getGroupBgColor(): string{
        const group = this.getCurrentGroup();
        if(!group){
            return 'bg-purple-50';
        }
        switch(group.type){
            case 'left-four':
                return 'bg-green-50';
            case 'right-four':
                return 'bg-blue-50';
            case 'two-thumbs':
                return 'bg-amber-50';
            default:
                return 'bg-purple-50';
        }
    }
    getGroupTextColor(): string{
        const group = this.getCurrentGroup();
        if(!group){
            return 'text-purple-700';
        }
        switch(group.type){
            case 'left-four':
                return 'text-green-700';
            case 'right-four':
                return 'text-blue-700';
            case 'two-thumbs':
                return 'text-amber-700';
            default:
                return 'text-purple-700';
        }
    }
    getGroupIcon(): string{
        const group = this.getCurrentGroup();
        if(!group){
            return 'pi pi-thumbs-up-fill';
        }
        switch(group.type){
            case 'left-four':
            case 'right-four':
                return 'pi pi-thumbs-up-fill';
            case 'two-thumbs':
                return 'pi pi-thumbs-up-fill';
            default:
                return 'pi pi-thumbs-up-fill';
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
    private finishCustomCapture(): void {
        const capturedFingers: TenFingerCapture = {};
        for (const group of this.captureGroups) {
            if (group.type === 'single' && group.capturedSingle) {
                (capturedFingers as any)[group.fingers[0].key] = group.capturedSingle.imageBase64;
            } else if(group.type === 'left-four' && group.capturedFingers?.length){
                this.assignFourFingersToResult(group.capturedFingers, 'left', capturedFingers);
            } else if(group.type === 'right-four' && group.capturedFingers?.length){
                this.assignFourFingersToResult(group.capturedFingers, 'right', capturedFingers);
            } else if(group.type === 'two-thumbs' && group.capturedFingers?.length){
                this.assignTwoThumbsToResult(group.capturedFingers, capturedFingers);
            }
        }
        this.fingersEnrolled.emit(capturedFingers);
        this.closeEnrollDialog();
    }
    private assignFourFingersToResult(fingers: SegmentedFinger[], hand: 'left' | 'right', result: TenFingerCapture): void{
        const typeMap = hand === 'left' ? SDK_FINGER_TYPE_MAP.LEFT : SDK_FINGER_TYPE_MAP.RIGHT;
        const fallbackOrder = hand === 'left' ? LEFT_FALLBACK_ORDER : RIGHT_FALLBACK_ORDER;
        const keyPrefix = hand === 'left' ? 'left' : 'right';

        for(const finger of fingers){
            if (finger.fingerType === typeMap.INDEX)  (result as any)[`${keyPrefix}Index`]  = finger.imageBase64;
            if (finger.fingerType === typeMap.MIDDLE)  (result as any)[`${keyPrefix}Middle`]  = finger.imageBase64;
            if (finger.fingerType === typeMap.RING)  (result as any)[`${keyPrefix}Ring`]  = finger.imageBase64;
            if (finger.fingerType === typeMap.LITTLE)  (result as any)[`${keyPrefix}Little`]  = finger.imageBase64;
        }
        const unknowns = fingers.filter(f => !f.fingerType);
        if(unknowns.length > 0){
            fallbackOrder.forEach((fingerKey, index) => {
                if(unknowns[index] && !result[fingerKey]){
                    (result as any)[fingerKey] = unknowns[index].imageBase64;
                }
            });
        }
    }
    private assignTwoThumbsToResult(fingers: SegmentedFinger[], result: TenFingerCapture): void{
        for(const finger of fingers){
            if(finger.fingerType === 6){
                result.leftThumb = finger.imageBase64;
            } else if(finger.fingerType === 1){
                result.rightThumb = finger.imageBase64;
            }
        }
        const unknowns = fingers.filter(f => f.fingerType !== 1 && f.fingerType !== 6);
        if(unknowns.length >= 2 && !result.leftThumb && !result.rightThumb){
            result.leftThumb = unknowns[0].imageBase64;
            result.rightThumb = unknowns[1].imageBase64;
        } else if(unknowns.length === 1){
            if(!result.leftThumb) result.leftThumb = unknowns[0].imageBase64;
            else if(!result.rightThumb) result.rightThumb = unknowns[0].imageBase64;
        }
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
