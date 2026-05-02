import { Component, inject, Input, ViewChild, DestroyRef, signal, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { PaginatedResponse, People } from '@/api/people';
import { MiscService } from '@/services/misc.service';
import { PeopleService } from '@/services/people.service';
import { SelectModule } from 'primeng/select';
import { EnrollFingerprintRequest, MatchResult, SearchFingerType } from '@/services/fingerprint.service';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { FingerprintService } from '../../services/fingerprint.service';
import { FingerprintEnrollDialogComponent } from './dialogs/components/fingerprint-enroll-dialog/fingerprint-enroll-dialog.component';
import { FingerprintCaptureDialogComponent } from './dialogs/components/fingerprint-capture-dialog/fingerprint-capture-dialog.component';
import { buildImageDataUrl, countCapturedFingers, FINGER_SEARCH_OPTIONS, FingerKey, formatPageRange, TenFingerCapture } from './models';
import { EnrollFaceRequest, FaceRecognitionService, FaceSearchResult } from '@/services/face-recognition.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { extractFileFromEvent, IMAGE_TYPES, readFileAsBase64 } from './utils/file.utils';
import { PersonSelectorComponent } from "./components/person-selector.component";
import { DataSearchTabComponent } from "./components/data-search-tab.component";
import { AddPersonFormComponent } from "./components/add-person-form.component";
import { FingerprintSearchTabComponent } from "./components/fingerprint-search-tab.component";
import { FaceSearchTabComponent } from "./components/face-search-tab.component";
// Tipos
export type PhotoType = 'front' | 'leftProfile' | 'rightProfile';
interface PhotoEntry{
    base64: string | null;
    preview: string | null;
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
    SelectModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    FingerprintCaptureDialogComponent,
    FingerprintEnrollDialogComponent,
    PersonSelectorComponent,
    DataSearchTabComponent,
    AddPersonFormComponent,
    FingerprintSearchTabComponent,
    FaceSearchTabComponent
],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PeopleComponent {
    //Injections
    private readonly formBuilder = inject(FormBuilder);
    private readonly peopleService = inject(PeopleService);
    private readonly fingerprintService = inject(FingerprintService);
    private readonly faceService = inject(FaceRecognitionService);
    private readonly messageService = inject(MessageService);
    private readonly miscService = inject(MiscService);
    private readonly destroyRef = inject(DestroyRef);
    // Componentes hijos
    @ViewChild('enrollDialog') enrollDialog!: FingerprintEnrollDialogComponent;
    @ViewChild('captureDialog') captureDialog!: FingerprintCaptureDialogComponent;

    //Entradas y Salidas
    readonly sendPeople = output<People | null>();

    @Input() set newPeople(personId: string | null){
        if(!personId){
            this.selectedPerson.set(null);
            this.form.reset();
            this.searchForm.reset();
            return;
        }
        this.peopleService.getById(personId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: (person) => {
                if(person){
                    this.selectedPerson.set(person);
                    this.form.patchValue(person);
                } else{
                    this.selectedPerson.set(null);
                    this.form.reset();
                    this.searchForm.reset();
                }
            },
            error: (error: Error) => this.showError('Error al obtener la persona: ' + error.message)
        });
    }

    // Estados
    readonly selectedPerson = signal<People | null>(null);
    readonly isMainDialogVisible = signal(false);
    readonly activeTabValue = signal('0');

    // Tab 1
    readonly dataSearchStep = signal(1);
    readonly currentPage = signal(1);
    readonly pageSize = signal(10);
    readonly sortBy: [[string, string]] = [['createdAt', 'DESC']];
    readonly totalRows = signal(0);
    readonly personList = signal<People[]>([]);
    searchFilter: Record<string, string> = {};
    // Tab 2
    readonly fingerprintStep = signal(1);
    readonly selectedSearchFinger = signal<SearchFingerType | null>(null);
    readonly selectedSearchFingerLabel = signal<string | null>(null);
    readonly fingerprintPreviewUrl = signal<string | null>(null);
    readonly capturedSearchImageBase64 = signal<string | null>(null);
    readonly isSearchImageFromLiveCapture = signal(false);
    readonly isFingerprintSearchLoading = signal(false);
    readonly fingerprintSearchResult = signal<MatchResult | null>(null);
    readonly fingerprintSearchError = signal('');
    readonly isAwaitingMatchConfirmation = signal(false);
    readonly activeSessionId = signal<string | null>(null);
    readonly noMatchWasFound = signal(false);

    readonly searchThreshold = 20;
    readonly highConfidenceThreshold = 40;
    // Tab 3
    readonly faceStep = signal(1);
    readonly faceSearchImageBase64 = signal<string | null>(null);
    readonly faceSearchPreviewUrl = signal<string | null>(null);
    readonly isFaceSearchLoading = signal(false);
    readonly faceSearchResult = signal<FaceSearchResult | null>(null);
    readonly faceSearchError = signal('');
    readonly faceNoMatchFound = signal(false);
    readonly isAwaitingFaceConfirmation = signal(false);

    // enrolamiento de huellas
    readonly enrolledFingers = signal<TenFingerCapture>({});
    // Visibilidad de apartado fotos
    readonly showPhotosSection = signal(false);
    // Enrolamiento de fotos
    readonly faceEnrollPhotos = signal<Record<PhotoType, PhotoEntry>>(createEmptyPhotos());

    readonly enrolledFingersCount = computed(() => countCapturedFingers(this.enrolledFingers()));

    readonly hasLeftHandFingers = computed(() =>
        LEFT_HAND_KEYS.some((k) => !!this.enrolledFingers()[k]));
    readonly hasRightHandFingers = computed(() =>
        RIGHT_HAND_KEYS.some(k => !!this.enrolledFingers()[k]));

    readonly faceEnrollFrontPreview = computed(() => this.faceEnrollPhotos().front.preview);
    readonly faceEnrollLeftProfilePreview = computed(() => this.faceEnrollPhotos().leftProfile.preview);
    readonly faceEnrollRightProfilePreview = computed(() => this.faceEnrollPhotos().rightProfile.preview);

    // formOptions: AbstractControlOptions = { validators: Validators.nullValidator };
    readonly form = this.formBuilder.group(
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
    );
    readonly searchForm = this.formBuilder.group(
        {
            firstName: [null as string | null, [Validators.required, Validators.maxLength(150)]],
            paternalName: [null as string | null, Validators.maxLength(150)],
            maternalName: [null as string | null, Validators.maxLength(150)],
            curp: [null as string | null, Validators.maxLength(18)]
        },
    );

    get addressFormArray(): FormArray{
        return this.form.controls.peopleAddresses;
    }
    // Dialog principal
    openDialog(): void{
        this.activeTabValue.set('0');
        this.resetAllState();
        this.isMainDialogVisible.set(true);
    }
    onTabChange(value: string | number): void{
        this.activeTabValue.set(String(value));
        this.resetAllState();
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
        this.dataSearchStep.set(2);
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
        this.dataSearchStep.set(3);
    }
    selectPerson(person: People): void {
        this.selectedPerson.set(person);
        this.sendPeople.emit(person);
        this.dataSearchStep.set(1);
        this.isMainDialogVisible.set(false);
    }
    loadPersonTable(event: TableLazyLoadEvent): void {
        const page = event.first! / event.rows! + 1;
        const rows = event.rows!;
        this.currentPage.set(page);
        this.pageSize.set(rows);

        this.peopleService.getList(rows, page, this.sortBy, this.searchFilter)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (response: PaginatedResponse<People>) => {
                        const total = response.meta.totalItems;
                        this.personList.set(total ? response.data : []);
                        this.totalRows.set(total || 0);
                        if(!total){
                            this.showWarning('No se encontraron personas')
                        }
                        this.miscService.endRquest();
                    },
                    error: (error: {error?: { message?: string } }) => {
                        this.personList.set([]);
                        this.totalRows.set(0);
                        this.miscService.endRquest();
                        this.showError('Error al buscar', error.error?.message);
                    },
                });
    }
    goBackDataStep(): void{
        this.dataSearchStep.update((s) => (s > 1 ? s-1 : s));
    }

    // Tab 2
    selectSearchFinger(fingerKey: string): void {
        this.selectedSearchFinger.set(fingerKey as SearchFingerType);
        this.selectedSearchFingerLabel.set(
            FINGER_SEARCH_OPTIONS.find(option => option.key === fingerKey)?.label ?? null);
        this.fingerprintSearchResult.set(null);
        this.fingerprintSearchError.set('');
        this.resetMatchConfirmation();
    }

    openCaptureDialog(): void {
        this.captureDialog.openCaptureDialog();
    }

    onSearchFingerCaptured(imageBase64: string): void {
        this.clearFingerprintSearchState();
        this.isSearchImageFromLiveCapture.set(true);
        this.capturedSearchImageBase64.set(imageBase64);
        this.fingerprintPreviewUrl.set(buildImageDataUrl(imageBase64, 'bmp'));
    }

    onSearchFileSelected(event: Event): void {
        const file = extractFileFromEvent(event);
        if(!file) return;

        readFileAsBase64(file, IMAGE_TYPES).subscribe({
            next: ({dataUrl, base64}) => {
                this.clearFingerprintSearchState();
                this.isSearchImageFromLiveCapture.set(false);
                this.fingerprintPreviewUrl.set(dataUrl);
                this.capturedSearchImageBase64.set(base64);
            },
            error: () => this.fingerprintSearchError.set('Formato invalido')
        });
    }

    searchByFingerprint(): void {
        const imageBase64 = this.capturedSearchImageBase64();
        const fingerType = this.selectedSearchFinger();

        if (!imageBase64) {
            this.fingerprintSearchError.set('Capture o seleccione una imagen');
            return;
        }
        if (!fingerType){
            this.fingerprintSearchError.set('Seleccione el dedo');
            return;
        }

        this.isFingerprintSearchLoading.set(true);
        this.fingerprintSearchResult.set(null);
        this.fingerprintSearchError.set('');
        this.resetMatchConfirmation();
        this.noMatchWasFound.set(false);

        this.fingerprintService.searchFingerprint({
            fingerprintImage: imageBase64,
            threshold: this.searchThreshold,
            highConfidenceThreshold: this.highConfidenceThreshold,
            fingerType,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: (result) => {
                this.handleFingerprintSearchResult(result);
                this.isFingerprintSearchLoading.set(false);
            },
            error: (error: Error) => {
                this.fingerprintSearchError.set(error.message || 'Error en la busqueda');
                this.isFingerprintSearchLoading.set(false);
            },
        });
    }

    confirmMatch(isCorrect: boolean): void {
        const sessionId = this.activeSessionId();
        if (!sessionId) {
            this.fingerprintSearchError.set('No hay sesion activa');
            return;
        }
        this.isFingerprintSearchLoading.set(true);

        this.fingerprintService
            .confirmMatch({ sessionId, isCorrect })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    if (isCorrect) {
                        this.fingerprintSearchResult.set(result);
                        this.isAwaitingMatchConfirmation.set(false);
                        if (result.peopleId) {
                            this.fetchAndSelectPerson(result.peopleId);
                        }
                    } else {
                        this.handleFingerprintSearchResult(result);
                    }
                    this.isFingerprintSearchLoading.set(false);
                },
                error: (error: Error) => {
                    this.fingerprintSearchError.set(error.message || 'Error al confirmar');
                    this.isFingerprintSearchLoading.set(false);
                    this.isAwaitingMatchConfirmation.set(false);
                },
            });
    }

    goToAddPersonFromFingerprint(): void {
        this.prepareAddPersonForm();
        this.fingerprintStep.set(3);
    }

    goBackFromFingerprintAddPerson(): void {
        if (this.fingerprintStep() === 3) this.fingerprintStep.set(1);
    }

    // Enrolamiento de huellas
    openEnrollDialog(): void {
        this.enrollDialog.openEnrollDialog();
    }

    onFingersEnrolled(capturedFingers: TenFingerCapture): void {
        this.enrolledFingers.update((current) => ({
            ...current,
            ...capturedFingers
        }));
    }

    removeEnrolledFinger(fingerKey: FingerKey): void{
        this.enrolledFingers.update((current) => {
            const updated = { ...current };
            delete updated[fingerKey];
            return updated;
        });
    }

    // Tab 3
    onFaceSearchFileSelected(event: Event): void{
        const file = extractFileFromEvent(event);
        if(!file) return;

        readFileAsBase64(file, IMAGE_TYPES).subscribe({
            next: ({dataUrl, base64}) => {
                this.faceSearchResult.set(null);
                this.faceSearchError.set('');
                this.faceNoMatchFound.set(false);
                this.faceSearchPreviewUrl.set(dataUrl);
                this.faceSearchImageBase64.set(base64);
            },
            error: () => this.faceSearchError.set('Formato no valido')
        });
    }

    searchByFace(): void{
        const imageBase64 = this.faceSearchImageBase64();
        if(!imageBase64){
            this.faceSearchError.set('Seleccione una imagen primero');
            return;
        }

        this.isFaceSearchLoading.set(true);
        this.faceSearchResult.set(null);
        this.faceSearchError.set('');
        this.faceNoMatchFound.set(false);
        this.isAwaitingFaceConfirmation.set(false);

        this.faceService.searchByFace({
            imageBase64
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: (result) => {
                this.faceSearchResult.set(result);
                if(result.isMatch && result.peopleId){
                    this.isAwaitingFaceConfirmation.set(true);
                } else {
                    this.faceNoMatchFound.set(true);
                }
                this.isFaceSearchLoading.set(false);
            },
            error: (err: Error) => {
                this.faceSearchError.set(err.message || 'Error en la busqueda facial');
                this.isFaceSearchLoading.set(false);
            },
        });
    }

    confirmFaceMatch(isCorrect: boolean): void{
        this.isAwaitingFaceConfirmation.set(false);
        const result = this.faceSearchResult();
        if(isCorrect && result?.peopleId){
            this.fetchAndSelectPerson(result.peopleId);
        } else{
            this.faceSearchResult.set(null);
            this.faceNoMatchFound.set(true);
        }
    }
    togglePhotosSection(): void{
        this.showPhotosSection.update((v) => !v);
    }
    goToAddPersonFromFace(): void{
        this.prepareAddPersonForm();
        this.faceStep.set(3);
    }

    goBackFromFaceAddPerson(): void{
        if(this.faceStep() === 3) this.faceStep.set(1);
    }
    // Fotos de enrolamiento
    onFaceEnrollPhotoSelected(event: Event, type: PhotoType): void{
        const file = extractFileFromEvent(event);
        if(!file) return;

        readFileAsBase64(file, IMAGE_TYPES).subscribe({
            next: ({dataUrl, base64}) => {
                this.faceEnrollPhotos.update(
                    current => ({
                        ...current,
                        [type]: { base64, preview: dataUrl }
                    })
                );
            },
            error: () => this.showError('Formato invalido')
        });
    }

    removeFaceEnrollPhoto(type: PhotoType): void{
        this.faceEnrollPhotos.update(
            current => ({
                ...current,
                [type]: { base64: null, preview: null }
            })
        );
    }

    savePersonComplete(): void{
        this.miscService.startRequest();
        if(this.form.invalid){
            this.showError('Faltan campos por añadir');
            this.miscService.endRquest();
            return;
        }
        const personData = this.buildPersonData();
        const hasFingerprints = this.enrolledFingersCount() > 0;
        const hasPhotos = !!this.faceEnrollPhotos().front.base64;

        if(hasFingerprints){
            this.enrollWithFingerprints(personData, hasPhotos);
        } else if(hasPhotos){
            this.enrollWithPhotos(personData);
        } else {
            this.enrollPersonOnly(personData);
        }
    }

    onAddressSelected(addressData: { id: string | null }, index: number, formArray: FormArray): void {
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
        this.selectedPerson.set(null);
        this.sendPeople.emit(null);
        this.form.reset();
        this.searchForm.reset();
        // this.newPeople = null;
    }

    getDialogHeader(): string {
        return 'Buscar Persona';
    }

    getPageRange(): string {
        return formatPageRange(this.currentPage(), this.pageSize(), this.totalRows());
    }

    private fetchAndSelectPerson(peopleId: string): void{
        this.peopleService
            .getById(peopleId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((person) => {
                if(person) this.selectPerson(person);
            })
    }

    private clearFingerprintSearchState(): void{
        this.fingerprintSearchResult.set(null);
        this.fingerprintSearchError.set('');
        this.resetMatchConfirmation();
    }

    // Metodos privados
    private buildPersonData(): Record<string, unknown>{
        const raw = this.form.getRawValue();
        return {
            ...raw,
            peopleAddresses: raw.peopleAddresses.map(
                ({address_data, ...rest}: {address_data: unknown; [key: string]: unknown}) => rest)
        };
    }
    private enrollWithFingerprints(personData: Record<string, unknown>, hasPhotos: boolean): void{
        const request = {
            ...personData as Partial<EnrollFingerprintRequest>,
            fingers: this.enrolledFingers()
        } as EnrollFingerprintRequest;

        this.fingerprintService
            .enrollFingerprint(request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res: { object: People }) => {
                    if(hasPhotos){
                        this.savePhotosAfterEnroll(res.object);
                    } else{
                        this.onSaveSuccess(res.object, 'Datos y huellas de persona guardada');
                    }
                },
                error: (err: { error?: { message?: string }; message?: string }) => this.onSaveError(err)
            })
    }
    private enrollWithPhotos(personData: Record<string, unknown>): void{
        const photos = this.faceEnrollPhotos();
        const request = {
            ...personData as Partial<EnrollFaceRequest>,
            imageFront: photos.front.base64!,
            imageLeftProfile: photos.leftProfile.base64 || undefined,
            imageRightProfile:photos.rightProfile.base64 || undefined
        } as EnrollFaceRequest;

        this.faceService.enrollWithFace(request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res: { object: People }) =>
                    this.onSaveSuccess(res.object, 'Datos y fotos de persona han sido guardadas'),
                error: (err: { error?: { message?: string }; message?: string }) => this.onSaveError(err)
            });
    }
    private enrollPersonOnly(personData: Record<string, unknown>): void{
        this.peopleService
            .create(personData)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) =>
                    this.onSaveSuccess(res.object, 'Datos de persona han sido guardadas'),
                error: (err: { error?: { message?: string }; message?: string }) => this.onSaveError(err)
            });
    }
    private savePhotosAfterEnroll(person: People): void{
        const photos = this.faceEnrollPhotos();
        this.faceService
            .savePhotosForPerson({
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
    private onSaveError(error: { error?: { message?: string }; message?: string }): void{
        this.miscService.endRquest();
        this.showError('Error al guardar', error.error?.message || error.message);
    }
    private handleFingerprintSearchResult(result: MatchResult): void{
        this.fingerprintSearchResult.set(result);
        if(result.requiresConfirmation){
            this.isAwaitingMatchConfirmation.set(true);
            this.activeSessionId.set(result.sessionId || null);
        } else{
            this.isAwaitingMatchConfirmation.set(false);
            if(!result.isMatch){
                this.noMatchWasFound.set(true);
            }
        }
    }

    private prepareAddPersonForm(): void{
        this.form.reset();
        this.clearAddressFormArray();
        this.enrolledFingers.set({});
        this.showPhotosSection.set(false);
        this.faceEnrollPhotos.set(createEmptyPhotos());
    }
    private resetMatchConfirmation(): void {
        this.isAwaitingMatchConfirmation.set(false);
        this.activeSessionId.set(null);
    }
    private resetAllState(): void {
        // Tab 1
        this.dataSearchStep.set(1);
        this.searchFilter = {};
        this.personList.set([]);
        this.totalRows.set(0);
        // Tab 2
        this.fingerprintStep.set(1);
        this.selectedSearchFinger.set(null);
        this.selectedSearchFingerLabel.set(null);
        this.fingerprintPreviewUrl.set(null);
        this.capturedSearchImageBase64.set(null);
        this.isSearchImageFromLiveCapture.set(false);
        this.isFingerprintSearchLoading.set(false);
        this.fingerprintSearchResult.set(null);
        this.fingerprintSearchError.set('');
        this.noMatchWasFound.set(false);
        this.resetMatchConfirmation();
        // Tab 3
        this.faceStep.set(1);
        this.faceSearchImageBase64.set(null);
        this.faceSearchPreviewUrl.set(null);
        this.isFaceSearchLoading.set(false);
        this.faceSearchResult.set(null);
        this.faceSearchError.set('');
        this.faceNoMatchFound.set(false);
        this.isAwaitingFaceConfirmation.set(false);
        this.faceEnrollPhotos.set(createEmptyPhotos());
        // Enrollment
        this.enrolledFingers.set({});
        this.showPhotosSection.set(false);
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
