import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output, ViewChild, input, DestroyRef } from '@angular/core';
import { AbstractControlOptions, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { FileUploadModule } from 'primeng/fileupload';
import { CommonModule, DatePipe } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { StepsModule } from 'primeng/steps';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { People } from '@/api/people';
import { MiscService } from '@/services/misc.service';
import { PeopleService } from '@/services/people.service';
import { DatePicker } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { AddressesComponent } from '../addresses/addresses.component';
import { EnrollFingerprintRequest, MatchResult, SearchFingerType } from '@/services/fingerprint.service';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { FingerprintService } from '../../services/fingerprint.service';
import { FingerprintEnrollDialogComponent } from './dialogs/components/fingerprint-enroll-dialog/fingerprint-enroll-dialog.component';
import { FingerprintCaptureDialogComponent } from './dialogs/components/fingerprint-capture-dialog/fingerprint-capture-dialog.component';
import { ADD_PERSON_FIELDS, buildImageDataUrl, countCapturedFingers, FINGER_SEARCH_OPTIONS, FingerKey, formatElapsedTime, formatPageRange, getScoreColorClass, LEFT_FINGER_SEARCH_OPTIONS, LEFT_FINGER_THUMBNAILS, RIGHT_FINGER_SEARCH_OPTIONS, RIGHT_FINGER_THUMBNAILS, SEARCH_FIELDS, TenFingerCapture } from './models';
import { Tooltip } from "primeng/tooltip";
import { EnrollFaceRequest, FaceRecognitionService, FaceSearchResult } from '@/services/face-recognition.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { extractFileFromEvent, IMAGE_TYPES, readFileAsBase64 } from './utils/file.utils';
import { MathResultCardComponent } from "./shared/match-result-card.component";
// Tipos
type PhotoType = 'front' | 'leftProfile' | 'rightProfile';
interface PhotoEntry{
    base64: string | null;
    preview: string | null;
}

interface PersonFormControls{
    firstName: FormControl<string | null>;
    paternalName: FormControl<string | null>;
    maternalName: FormControl<string | null>;
    birthDate: FormControl<Date | string | null>;
    alias: FormControl<string | null>;
    curp: FormControl<string | null>;
    gender: FormControl<string | null>;
    maritalStatus: FormControl<string | null>;
    educationLevel: FormControl<string | null>;
    occupation: FormControl<string | null>;
    peopleAddresses: FormArray;
}

const LEFT_HAND_KEYS: FingerKey[] = ['leftThumb', 'leftIndex', 'leftMiddle', 'leftRing', 'leftLittle'];
const RIGHT_HAND_KEYS: FingerKey[] = ['rightThumb', 'rightIndex', 'rightMiddle', 'rightRing', 'rightLittle'];

function createEmptyPhotos(): Record<PhotoType, PhotoEntry>{
    return {
        front: { base64: null, preview: null },
        leftProfile: { base64: null, preview: null },
        rightProfile: { base64: null, preview: null }
    };
}
interface PaginatedResponse<T>{
    data: T[];
    meta: {
        totalItems: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}
interface ApiCreateResponse{
    object: People;
    message?: string;
}

@Component({
    selector: 'app-people',
    templateUrl: './people.component.html',
    providers: [DatePipe],
    imports: [
    CommonModule,
    InputTextModule,
    AccordionModule,
    CardModule,
    DialogModule,
    ToastModule,
    StepsModule,
    ButtonModule,
    TableModule,
    FormsModule,
    ReactiveFormsModule,
    InputNumberModule,
    MessageModule,
    CalendarModule,
    InputSwitchModule,
    MultiSelectModule,
    FileUploadModule,
    ImageModule,
    InputMaskModule,
    DatePicker,
    SelectModule,
    AddressesComponent,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    FingerprintCaptureDialogComponent,
    FingerprintEnrollDialogComponent,
    Tooltip,
    MathResultCardComponent
],
    standalone: true
})
export class PeopleComponent {
    //Injections
    private readonly formBuilder = inject(FormBuilder);
    private readonly peopleService = inject(PeopleService);
    private readonly fingerprintService = inject(FingerprintService);
    private readonly faceService = inject(FaceRecognitionService);
    private readonly messageService = inject(MessageService);
    private readonly miscService = inject(MiscService);
    private readonly changeDetector = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);
    // Componentes hijos
    @ViewChild('enrollDialog') enrollDialog!: FingerprintEnrollDialogComponent;
    @ViewChild('captureDialog') captureDialog!: FingerprintCaptureDialogComponent;

    //Entradas y Salidas
    selectedPerson: People | null = null;
    @Output() sendPeople = new EventEmitter<People | null>();

    @Input() set newPeople(personId: any){
        if(!personId){
            this.selectedPerson = null;
            this.form.reset();
            this.searchForm.reset();
            return;
        }
        this.peopleService.getById(personId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: person => {
                if(person){
                    this.selectedPerson = person;
                    // const {firstName, paternalName, maternalName, birthDate, alias, curp, gender, maritalStatus, educationLevel, occupation} = person;
                    this.form.patchValue(person);
                } else{
                    this.selectedPerson = null;
                    this.form.reset();
                    this.searchForm.reset();
                }
            },
            error: (error: Error) => this.showError('Error al obtener la persona: ' + error.message)
        });
    }

    // formOptions: AbstractControlOptions = { validators: Validators.nullValidator };
    form = this.formBuilder.group(
        {
            firstName: [null as string | null, [Validators.required, Validators.maxLength(150)]],
            paternalName: [null as string | null, [Validators.maxLength(100)]],
            maternalName: [null as string | null, [Validators.maxLength(100)]],
            birthDate: [null as Date | string | null],
            alias: [null as string | null, Validators.maxLength(150)],
            curp: [null as string | null, Validators.maxLength(18)],
            gender: [null as string | null],
            maritalStatus: [null as string | null],
            educationLevel: [null as string | null],
            occupation: [null as string | null],
            peopleAddresses: this.formBuilder.array([], Validators.required)
        },
        // this.formOptions
    );
    searchForm = this.formBuilder.group(
        {
            firstName: [null, [Validators.required, Validators.maxLength(150)]],
            paternalName: [null, Validators.maxLength(150)],
            maternalName: [null, Validators.maxLength(150)],
            curp: [null, Validators.maxLength(18)]
        },
        // this.formOptions
    );
    // Estado del dialog principal
    isMainDialogVisible = false;
    activeTabValue = '0';

    // Tab 1
    dataSearchStep = 1;
    currentPage = 1;
    pageSize = 10;
    sortBy: [[string, string]] = [['createdAt', 'DESC']];
    totalRows = 0;
    personList: People[] = [];
    searchFilter: Record<string, string> = {};
    // Tab 2
    fingerprintStep = 1;
    selectedSearchFinger: SearchFingerType | null = null;
    selectedSearchFingerLabel: string | null = null;
    fingerprintPreviewUrl: string | null = null;
    capturedSearchImageBase64: string | null = null;
    isSearchImageFromLiveCapture = false;
    isFingerprintSearchLoading = false;
    fingerprintSearchResult: MatchResult | null = null;
    fingerprintSearchError = '';
    isAwaitingMatchConfirmation = false;
    activeSessionId: string | null = null;
    searchThreshold = 20;
    highConfidenceThreshold = 40;
    noMatchWasFound = false;
    // Tab 3
    faceStep = 1;
    faceSearchImageBase64: string | null = null;
    faceSearchPreviewUrl: string | null = null;
    isFaceSearchLoading = false;
    faceSearchResult: FaceSearchResult | null = null;
    faceSearchError = '';
    faceNoMatchFound = false;
    isAwaitingFaceConfirmation = false;

    // enrolamiento de huellas
    enrolledFingers: TenFingerCapture = {};
    enrolledFingersCount = 0;
    // Visibilidad de apartado fotos
    showPhotosSection = false;
    // Enrolamiento de fotos
    faceEnrollPhotos: Record<PhotoType, PhotoEntry> = createEmptyPhotos();

    // Constantes template
    readonly searchFields = SEARCH_FIELDS;
    readonly addPersonFields = ADD_PERSON_FIELDS;
    readonly leftFingerSearchOptions = LEFT_FINGER_SEARCH_OPTIONS;
    readonly rightFingerSearchOptions = RIGHT_FINGER_SEARCH_OPTIONS;
    readonly leftFingerThumbnails = LEFT_FINGER_THUMBNAILS;
    readonly rightFingerThumbnails = RIGHT_FINGER_THUMBNAILS;

    get addressFormArray(): FormArray{
        return this.form.controls.peopleAddresses;
    }

    // Dialog principal
    openDialog(): void{
        this.activeTabValue = '0';
        this.resetAllState();
        this.isMainDialogVisible = true;
        this.changeDetector.detectChanges();
    }
    onTabChange(value: string | number): void{
        this.activeTabValue = String(value);
        this.resetAllState();
        this.changeDetector.detectChanges();
    }

    // Tab 1
    searchPersonByData(): void {
        this.searchFilter = {};
        if (this.searchForm.invalid) {
            this.miscService.endRquest();
            this.showWarning('El Nombre es un dato obligatorio para busqueda');
            return;
        }
        this.miscService.startRequest();
        this.dataSearchStep = 2;
        const values = this.searchForm.value;
        for (const key of Object.keys(values)) {
            const fieldValue = values[key];
            if (fieldValue != null && fieldValue !== '') {
                this.searchFilter[key] = '$ilike:' + fieldValue;
            }
        }
    }

    addPerson(): void {
        const { curp, firstName, paternalName, maternalName} = this.searchForm.controls;
        this.form.patchValue({
            curp: curp.value,
            firstName: firstName.value,
            paternalName: paternalName.value,
            maternalName: maternalName.value
        });
        this.dataSearchStep = 3;
    }
    selectPerson(person: People): void {
        this.selectedPerson = person;
        this.sendPeople.emit(person);
        this.dataSearchStep = 1;
        this.isMainDialogVisible = false;
    }
    loadPersonTable(event: TableLazyLoadEvent): void {
        this.currentPage = event.first! / event.rows! + 1;
        this.pageSize = event.rows!;
        this.peopleService.getList(this.pageSize, this.currentPage, this.sortBy, this.searchFilter)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: (response: PaginatedResponse<People>) => {
                const total = response.meta.totalItems;
                this.personList = total ? response.data : [];
                this.totalRows = total || 0;
                if(!total){
                    this.showWarning('No se encontraron personas')
                }
                this.miscService.endRquest();
            },
            error: (error: any) => {
                this.personList = [];
                this.totalRows = 0;
                this.miscService.endRquest();
                this.showError('Error al buscar', error.error?.message);
            },
        });
    }
    goBackDataStep(): void{
        if(this.dataSearchStep > 1) this.dataSearchStep--;
    }

    // Tab 2
    selectSearchFinger(fingerKey: string): void {
        this.selectedSearchFinger = fingerKey as SearchFingerType;
        this.selectedSearchFingerLabel = FINGER_SEARCH_OPTIONS.find(option => option.key === fingerKey)?.label ?? null;
        this.fingerprintSearchResult = null;
        this.fingerprintSearchError = '';
        this.resetMatchConfirmation();
    }

    openCaptureDialog(): void {
        this.captureDialog.openCaptureDialog();
    }

    onSearchFingerCaptured(imageBase64: string): void {
        this.fingerprintSearchResult = null;
        this.fingerprintSearchError = '';
        this.resetMatchConfirmation();
        this.isSearchImageFromLiveCapture = true;
        this.capturedSearchImageBase64 = imageBase64;
        this.fingerprintPreviewUrl = buildImageDataUrl(imageBase64, 'bmp');
    }

    onSearchFileSelected(event: Event): void {
        const file = extractFileFromEvent(event);
        if(!file) return;

        readFileAsBase64(file, IMAGE_TYPES).subscribe({
            next: ({dataUrl, base64}) => {
                this.fingerprintSearchResult = null;
                this.fingerprintSearchError = '';
                this.resetMatchConfirmation();
                this.isSearchImageFromLiveCapture = false;
                this.fingerprintPreviewUrl = dataUrl;
                this.capturedSearchImageBase64 = base64;
            },
            error: () => {
                this.fingerprintSearchError = 'Formato invalido'
            },
        });
    }

    searchByFingerprint(): void {
        if (!this.capturedSearchImageBase64) {
            this.fingerprintSearchError = 'Capture o seleccione una imagen';
            return;
        }
        if (!this.selectedSearchFinger){
            this.fingerprintSearchError = 'Seleccione el dedo';
            return;
        }

        this.isFingerprintSearchLoading = true;
        this.fingerprintSearchResult = null;
        this.fingerprintSearchError = '';
        this.resetMatchConfirmation();
        this.noMatchWasFound = false;

        this.fingerprintService.searchFingerprint({
            fingerprintImage: this.capturedSearchImageBase64,
            threshold: this.searchThreshold,
            highConfidenceThreshold: this.highConfidenceThreshold,
            fingerType: this.selectedSearchFinger,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: result => {
                this.handleFingerprintSearchResult(result);
                this.isFingerprintSearchLoading = false;
            },
            error: (error: Error) => {
                this.fingerprintSearchError = error.message || 'Error en la busqueda';
                this.isFingerprintSearchLoading = false;
            },
        });
    }

    confirmMatch(isCorrect: boolean): void {
        if (!this.activeSessionId) {
            this.fingerprintSearchError = 'No hay sesion activa';
            return;
        }
        this.isFingerprintSearchLoading = true;

        this.fingerprintService
        .confirmMatch({ sessionId: this.activeSessionId, isCorrect })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: result => {
                if (isCorrect) {
                    this.fingerprintSearchResult = result;
                    this.isAwaitingMatchConfirmation = false;
                    if (result.peopleId) {
                        this.peopleService.getById(result.peopleId)
                        .pipe(takeUntilDestroyed(this.destroyRef))
                        .subscribe(person => {
                            if (person) this.selectPerson(person);
                        });
                    }
                } else {
                    this.handleFingerprintSearchResult(result);
                }
                this.isFingerprintSearchLoading = false;
            },
            error: (error: Error) => {
                this.fingerprintSearchError = error.message || 'Error al confirmar';
                this.isFingerprintSearchLoading = false;
                this.isAwaitingMatchConfirmation = false;
            },
        });
    }

    goToAddPersonFromFingerprint(): void {
        this.prepareAddPersonForm();
        this.fingerprintStep = 3;
    }

    goBackFromFingerprintAddPerson(): void {
        if (this.fingerprintStep === 3) this.fingerprintStep = 1;
    }

    // Enrolamiento de huellas
    openEnrollDialog(): void {
        this.enrollDialog.openEnrollDialog();
    }

    onFingersEnrolled(capturedFingers: TenFingerCapture): void {
        this.enrolledFingers = {
            ...this.enrolledFingers,
            ...capturedFingers
        };
        this.enrolledFingersCount = countCapturedFingers(this.enrolledFingers);
    }

    removeEnrolledFinger(fingerKey: FingerKey): void{
        const updated = {
            ...this.enrolledFingers
        };
        delete updated[fingerKey];
        this.enrolledFingers = updated;
        this.enrolledFingersCount = countCapturedFingers(this.enrolledFingers);
    }

    isFingerAlreadyEnrolled(fingerKey: FingerKey): boolean{
        return !!this.enrolledFingers[fingerKey];
    }

    // Tab 3
    onFaceSearchFileSelected(event: Event): void{
        const file = extractFileFromEvent(event);
        if(!file) return;

        readFileAsBase64(file, IMAGE_TYPES).subscribe({
            next: ({dataUrl, base64}) => {
                this.faceSearchResult = null;
                this.faceSearchError = '';
                this.faceNoMatchFound = false;
                this.faceSearchPreviewUrl = dataUrl;
                this.faceSearchImageBase64 = base64;
            },
            error: () => {
                this.faceSearchError = 'Formato no valido';
            }
        });
    }

    searchByFace(): void{
        if(!this.faceSearchImageBase64){
            this.faceSearchError = 'Seleccione una imagen primero';
            return;
        }

        this.isFaceSearchLoading = true;
        this.faceSearchResult = null;
        this.faceSearchError = '';
        this.faceNoMatchFound = false;
        this.isAwaitingFaceConfirmation = false;

        this.faceService.searchByFace({
            imageBase64: this.faceSearchImageBase64
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: result => {
                this.faceSearchResult = result;
                if(result.isMatch && result.peopleId){
                    this.isAwaitingFaceConfirmation = true;
                } else {
                    this.faceNoMatchFound = true;
                }
                this.isFaceSearchLoading = false;
            },
            error: (err: Error) => {
                this.faceSearchError = err.message || 'Error en la busqueda facial';
                this.isFaceSearchLoading = false;
            },
        });
    }

    confirmFaceMatch(isCorrect: boolean): void{
        this.isAwaitingFaceConfirmation = false;
        if(isCorrect && this.faceSearchResult?.peopleId){
            this.peopleService.getById(this.faceSearchResult.peopleId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(person => {
                if(person){
                    this.selectPerson(person);
                }
            });
        } else{
            this.faceSearchResult = null;
            this.faceNoMatchFound = true;
        }
    }
    togglePhotosSection(): void{
        this.showPhotosSection = !this.showPhotosSection;
    }
    goToAddPersonFromFace(): void{
        this.prepareAddPersonForm();
        this.faceStep = 3;
    }

    goBackFromFaceAddPerson(): void{
        if(this.faceStep === 3) this.faceStep = 1;
    }
    // Fotos de enrolamiento
    onFaceEnrollPhotoSelected(event: Event, type: PhotoType): void{
        const file = extractFileFromEvent(event);
        if(!file) return;

        readFileAsBase64(file, IMAGE_TYPES).subscribe({
            next: ({dataUrl, base64}) => {
                this.faceEnrollPhotos[type] = {
                    base64,
                    preview: dataUrl
                };
            },
            error: () => {
                this.showError('Formato invalido');
            }
        });
    }

    removeFaceEnrollPhoto(type: PhotoType): void{
        this.faceEnrollPhotos[type] = {
            base64: null,
            preview: null
        };
    }
    get faceEnrollFrontPreview(): string | null{
        return this.faceEnrollPhotos.front.preview;
    }
    get faceEnrollLeftProfilePreview(): string | null{
        return this.faceEnrollPhotos.leftProfile.preview;
    }
    get faceEnrollRightProfilePreview(): string | null{
        return this.faceEnrollPhotos.rightProfile.preview;
    }

    savePersonComplete(): void{
        this.miscService.startRequest();
        if(this.form.invalid){
            this.showError('Faltan campos por añadir');
            this.miscService.endRquest();
            return;
        }
        const personData = this.buildPersonData();
        const hasFingerprints = this.enrolledFingersCount > 0;
        const hasPhotos = !!this.faceEnrollPhotos.front.base64;

        if(hasFingerprints){
            this.enrollWithFingerprints(personData, hasPhotos);
        } else if(hasPhotos){
            this.enrollWithPhotos(personData);
        } else {
            this.enrollPersonOnly(personData);
        }
    }

    onAddressSelected(addressData: any, index: number, formArray: FormArray): void {
        const value = addressData
            ? {address: addressData.id, address_data: addressData}
            : {address: null, address_data: null}
        formArray.at(index).patchValue(value);
    }

    addAddressRow(formArray: FormArray): void {
        formArray.push(this.formBuilder.group({
            address: [null, Validators.required],
            address_data: [null]
        }));
    }

    removeAddressRow(formArray: FormArray, index: number): void {
        formArray.removeAt(index);
    }
    // Helpers para template
    removePerson(): void {
        this.selectedPerson = null;
        this.sendPeople.emit(null);
        this.newPeople = null;
    }

    getDialogHeader(): string {
        return 'Buscar Persona';
    }

    getScoreColor(score: number): string {
        return getScoreColorClass(score);
    }

    formatTime(milliseconds: number): string {
        return formatElapsedTime(milliseconds);
    }

    getPageRange(): string {
        return formatPageRange(this.currentPage, this.pageSize, this.totalRows);
    }

    getEnrolledFingerImage(fingerKey: FingerKey): string {
        return this.enrolledFingers?.[fingerKey] ?? '';
    }

    hasLeftHandFingers(): boolean {
        return LEFT_HAND_KEYS.some(k => !!this.enrolledFingers[k]);
    }

    hasRightHandFingers(): boolean {
        return RIGHT_HAND_KEYS.some(k => !!this.enrolledFingers[k]);
    }

    // Metodos privados
    private buildPersonData(): Record<string, any>{
        const raw = this.form.getRawValue();
        return {
            ...raw,
            peopleAddresses: raw.peopleAddresses.map(({
                address_data,
                ...rest
            }:any) => rest)
        };
    }
    private enrollWithFingerprints(personData: Record<string, any>, hasPhotos: boolean): void{
        const request: EnrollFingerprintRequest = {
            ...personData,
            fingers: this.enrolledFingers
        } as any;
        this.fingerprintService.enrollFingerprint(request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: (res: ApiCreateResponse) => {
                const person = res.object;
                if(hasPhotos){
                    this.savePhotosAfterEnroll(person);
                } else{
                    this.onSaveSuccess(person, 'Datos y huellas de persona guardada');
                }
            },
            error: (err: any) => this.onSaveError(err)
        })
    }
    private enrollWithPhotos(personData: Record<string, any>): void{
        const photos = this.faceEnrollPhotos;
        const request: EnrollFaceRequest = {
            ...personData,
            imageFront: photos.front.base64,
            imageLeftProfile: photos.leftProfile.base64 || undefined,
            imageRightProfile:photos.rightProfile.base64 || undefined
        } as any;

        this.faceService.enrollWithFace(request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: (res: ApiCreateResponse) =>
                this.onSaveSuccess(res.object, 'Datos y fotos de persona han sido guardadas'),
            error: (err: any) => this.onSaveError(err)
        });
    }
    private enrollPersonOnly(personData: Record<string, any>): void{
        this.peopleService.create(personData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: (res: ApiCreateResponse) =>
                this.onSaveSuccess(res.object, 'Datos de persona han sido guardadas'),
            error: (err: any) => this.onSaveError(err)
        });
    }
    private savePhotosAfterEnroll(person: People): void{
        const photos = this.faceEnrollPhotos;
        this.faceService.savePhotosForPerson({
            peopleId: person.id,
            imageFront: photos.front.base64!,
            imageLeftProfile: photos.leftProfile.base64 || undefined,
            imageRightProfile: photos.rightProfile.base64 || undefined
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: () => this.onSaveSuccess(person, 'Datos, Huellas y fotos de persona guardadas correctamente'),
            error: () => {
                this.miscService.endRquest();
                this.showWarning('Datos y huellas de persona guardadas, pero hubo un error con las fotos');
                this.selectPerson(person);
            }
        });
    }
    private onSaveSuccess(person: People, message: string): void{
        this.selectPerson(person);
        this.miscService.endRquest();
        this.showSuccess(message);
    }
    private onSaveError(error: any): void{
        this.miscService.endRquest();
        this.showError('Error al guardar', error.error?.message || error.message);
    }
    private handleFingerprintSearchResult(result: MatchResult): void{
        this.fingerprintSearchResult = result;
        if(result.requiresConfirmation){
            this.isAwaitingMatchConfirmation = true;
            this.activeSessionId = result.sessionId || null;
        } else{
            this.isAwaitingMatchConfirmation = false;
            if(!result.isMatch){
                this.noMatchWasFound = true;
            }
        }
    }

    private prepareAddPersonForm(): void{
        this.form.reset();
        this.clearAddressFormArray();
        this.enrolledFingers = {};
        this.enrolledFingersCount = 0;
        this.showPhotosSection = false;
        this.faceEnrollPhotos = createEmptyPhotos();
    }
    private resetMatchConfirmation(): void {
        this.isAwaitingMatchConfirmation = false;
        this.activeSessionId = null;
    }
    private resetAllState(): void {
        // Tab 1
        this.dataSearchStep = 1;
        this.searchFilter = {};
        this.personList = [];
        this.totalRows = 0;
        // Tab 2
        this.fingerprintStep = 1;
        this.selectedSearchFinger = null;
        this.selectedSearchFingerLabel = null;
        this.fingerprintPreviewUrl = null;
        this.capturedSearchImageBase64 = null;
        this.isSearchImageFromLiveCapture = false;
        this.isFingerprintSearchLoading = false;
        this.fingerprintSearchResult = null;
        this.fingerprintSearchError = '';
        this.noMatchWasFound = false;
        this.resetMatchConfirmation();
        // Tab 3
        this.faceStep = 1;
        this.faceSearchImageBase64 = null;
        this.faceSearchPreviewUrl = null;
        this.isFaceSearchLoading = false;
        this.faceSearchResult = null;
        this.faceSearchError = '';
        this.faceNoMatchFound = false;
        this.isAwaitingFaceConfirmation = false;
        this.faceEnrollPhotos = createEmptyPhotos();
        // Enrollment
        this.enrolledFingers = {};
        this.enrolledFingersCount = 0;
        this.showPhotosSection = false;
        // Forms
        this.form.reset();
        this.searchForm.reset();
        this.clearAddressFormArray();
    }

    private clearAddressFormArray(): void {
        const addressArray = this.addressFormArray;
        while (addressArray.length > 0) addressArray.removeAt(0);
    }

    private showSuccess(message: string): void {
        this.messageService.add({ severity: 'success', key: 'msg', summary: message, life: 3000 });
    }

    private showError(summary: string, detail?: string): void {
        this.messageService.add({ life: 5000, key: 'msg', severity: 'error', summary, detail });
    }

    private showWarning(message: string): void {
        this.messageService.add({ life: 5000, key: 'msg', severity: 'warn', summary: message });
    }
}
