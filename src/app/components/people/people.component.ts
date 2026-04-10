import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControlOptions, FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { EnrollFingerprintRequest, MatchResult } from '@/services/fingerprint.service';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { FingerprintService } from '../../services/fingerprint.service';
import { FingerprintEnrollDialogComponent } from './dialogs/components/fingerprint-enroll-dialog/fingerprint-enroll-dialog.component';
import { FingerprintCaptureDialogComponent } from './dialogs/components/fingerprint-capture-dialog/fingerprint-capture-dialog.component';
import { ADD_PERSON_FIELDS, buildImageDataUrl, countCapturedFingers, FINGER_SEARCH_OPTIONS, FingerKey, formatElapsedTime, formatPageRange, getScoreColorClass, LEFT_FINGER_SEARCH_OPTIONS, LEFT_FINGER_THUMBNAILS, RIGHT_FINGER_SEARCH_OPTIONS, RIGHT_FINGER_THUMBNAILS, SEARCH_FIELDS, TenFingerCapture } from './models';
import { Tooltip } from "primeng/tooltip";

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
    Tooltip
],
    standalone: true
})
export class PeopleComponent implements OnInit {
    //Injections
    private formBuilder = inject(FormBuilder);
    private peopleService = inject(PeopleService);
    private fingerprintService = inject(FingerprintService);
    private messageService = inject(MessageService);
    private miscService = inject(MiscService);
    private changeDetector = inject(ChangeDetectorRef);
    // Componentes hijos
    @ViewChild('enrollDialog') enrollDialog!: FingerprintEnrollDialogComponent;
    @ViewChild('captureDialog') captureDialog!: FingerprintCaptureDialogComponent;

    //Entradas y Salidas
    selectedPerson: People | null = null;
    @Output() sendPeople = new EventEmitter<People | null>();

    @Input() set newPeople(personId: any){
        if(personId){
            this.peopleService.getById(personId)
            .subscribe({
                next: person => {
                    if(person){
                        this.selectedPerson = person;
                        this.form.patchValue(person);
                        this.form.patchValue(person);
                    } else{
                        this.selectedPerson = null;
                        this.form.reset();
                        this.searchForm.reset();
                    }
                },
                error: error => this.showError('Error al obtener la persona: ' + error.message)
            });
        } else{
            this.selectedPerson = null;
            this.form.reset();
            this.searchForm.reset();
        }
    }

    formOptions: AbstractControlOptions = { validators: Validators.nullValidator };
    form = this.formBuilder.group(
        {
            firstName: [null, [Validators.required, Validators.maxLength(150)]],
            paternalName: [null, [Validators.maxLength(100)]],
            maternalName: [null, [Validators.maxLength(100)]],
            birthDate: [null],
            alias: [null, Validators.maxLength(150)],
            curp: [null, Validators.maxLength(18)],
            gender: [null],
            maritalStatus: [null],
            educationLevel: [null],
            occupation: [null],
            peopleAddresses: this.formBuilder.array([], Validators.required)
        },
        this.formOptions
    );
    searchForm = this.formBuilder.group(
        {
            firstName: [null, [Validators.required, Validators.maxLength(150)]],
            paternalName: [null, Validators.maxLength(150)],
            maternalName: [null, Validators.maxLength(150)],
            curp: [null, Validators.maxLength(18)]
        },
        this.formOptions
    );
    // Estado del dialog principal
    isMainDialogVisible = false;
    activeTabValue = '0';

    // Tab 1
    dataSearchStep = 1;
    currentPage = 1;
    pageSize = 10;
    sortBy:[[string, string]] = [['createdAt', 'DESC']];
    totalRows = 0;
    personList: People[] = [];
    searchFilter = {};
    // Tab 2
    fingerprintStep = 1;
    selectedSearchFinger: string | null = null;
    selectedSearchFingerLabel: string | null = null;
    fingerprintPreviewUrl: string | null = null;
    capturedSearchImageBase64: string | null = null;
    isSearchImageFromLiveCapture = false;
    isFingerprintSearchLoading = false;
    fingerprintSearchResult: MatchResult | null = null;
    fingerprintSearchError = '';
    isAwaitingMatchConfirmation = false;
    activeSessionId: string | null = null;
    searchThreshold = 40;
    highConfidenceThreshold = 100;
    noMatchWasFound = false;

    // enrolamiento de huellas
    enrolledFingers: TenFingerCapture = {};
    enrolledFingersCount = 0;

    // Constantes template
    readonly searchFields = SEARCH_FIELDS;
    readonly addPersonFields = ADD_PERSON_FIELDS;
    readonly leftFingerSearchOptions = LEFT_FINGER_SEARCH_OPTIONS;
    readonly rightFingerSearchOptions = RIGHT_FINGER_SEARCH_OPTIONS;
    readonly leftFingerThumbnails = LEFT_FINGER_THUMBNAILS;
    readonly rightFingerThumbnails = RIGHT_FINGER_THUMBNAILS;

    ngOnInit(): void{}

    // Dialog principal
    openDialog(){
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
        for (const fieldName in this.searchForm.value) {
            const fieldValue = this.searchForm.controls[fieldName]?.value;
            if (fieldValue != null && fieldValue !== '') {
                this.searchFilter[fieldName] = '$ilike:' + fieldValue;
            }
        }
    }

    addPerson() {
        this.form.controls.curp.setValue(this.searchForm.controls.curp.value);
        this.form.controls.firstName.setValue(this.searchForm.controls.firstName.value);
        this.form.controls.paternalName.setValue(this.searchForm.controls.paternalName.value);
        this.form.controls.maternalName.setValue(this.searchForm.controls.maternalName.value);
        // this.nextStep();
        this.dataSearchStep = 3;
    }
    selectPerson(person: People): void {
        this.selectedPerson = person;
        this.sendPeople.emit(person);
        this.dataSearchStep = 1;
        this.isMainDialogVisible = false;
    }
    savePersonWithoutFingerprints(): void {
        this.miscService.startRequest();
        if (this.form.invalid) {
            this.showError('Faltan campos por añadir');
            this.miscService.endRquest();
            return;
        }
        const formData = this.form.getRawValue();
        const cleanAddresses = this.removeAddressMetadata(formData.peopleAddresses);
        this.peopleService.create({ ...formData, peopleAddresses: cleanAddresses }).subscribe({
            next: (response: any) => {
                this.selectPerson(response['object']);
                this.miscService.endRquest();
                this.showSuccess('Operacion correcta');
            },
            error: (error: any) => {
                this.miscService.endRquest();
                this.showError('Error al guardar persona', error.error?.message);
            },
        });
    }

    loadPersonTable(event: TableLazyLoadEvent): void {
        this.currentPage = event.first / event.rows + 1;
        this.pageSize = event.rows;
        this.peopleService.getList(this.pageSize, this.currentPage, this.sortBy, this.searchFilter).subscribe({
            next: (response: any) => {
                if (response['meta']['totalItems'] !== 0) {
                    this.personList = response['data'];
                    this.totalRows = response['meta']['totalItems'];
                } else {
                    this.personList = [];
                    this.totalRows = 0;
                    this.showWarning('No se encontraron personas');
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
        this.selectedSearchFinger = fingerKey;
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
        const fileInput = event.target as HTMLInputElement;
        const selectedFile = fileInput.files?.[0];
        if (!selectedFile) return;

        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
        if (!allowedTypes.includes(selectedFile.type.toLowerCase())) {
            this.fingerprintSearchError = 'Formato invalido (PNG, JPG, BMP)';
            fileInput.value = '';
            return;
        }

        this.fingerprintSearchResult = null;
        this.fingerprintSearchError = '';
        this.resetMatchConfirmation();
        this.isSearchImageFromLiveCapture = false;

        const reader = new FileReader();
        reader.onload = loadEvent => {
            if (loadEvent.target?.result) {
                const dataUrl = loadEvent.target.result as string;
                this.fingerprintPreviewUrl = dataUrl;
                this.capturedSearchImageBase64 = dataUrl.split(',')[1];
            }
        };
        reader.readAsDataURL(selectedFile);
        fileInput.value = '';
    }

    searchByFingerprint(): void {
        if (!this.capturedSearchImageBase64) {
            this.fingerprintSearchError = 'Capture o seleccione una imagen';
            return;
        }
        if (!this.selectedSearchFinger){
            this.fingerprintSearchError = 'Seleccione el dedo'; return;
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
            fingerType: this.selectedSearchFinger as any,
        }).subscribe({
            next: result => {
                this.handleSearchResult(result);
                this.isFingerprintSearchLoading = false;
            },
            error: error => {
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

        this.fingerprintService.confirmMatch({ sessionId: this.activeSessionId, isCorrect }).subscribe({
            next: result => {
                if (isCorrect) {
                    this.fingerprintSearchResult = result;
                    this.isAwaitingMatchConfirmation = false;
                    if (result.peopleId) {
                        this.peopleService.getById(result.peopleId).subscribe(person => {
                            if (person) this.selectPerson(person);
                        });
                    }
                } else {
                    this.handleSearchResult(result);
                }
                this.isFingerprintSearchLoading = false;
            },
            error: error => {
                this.fingerprintSearchError = error.message || 'Error al confirmar';
                this.isFingerprintSearchLoading = false;
                this.isAwaitingMatchConfirmation = false;
            },
        });
    }

    goToAddPersonFromFingerprint(): void {
        this.enrolledFingers = {};
        this.enrolledFingersCount = 0;
        this.form.reset();
        this.clearAddressFormArray();
        this.fingerprintStep = 3;
    }

    goBackFromFingerprintAddPerson(): void {
        if (this.fingerprintStep === 3) {
            this.fingerprintStep = 1;
        }
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

    savePersonWithFingerprints(): void {
        this.miscService.startRequest();

        if (this.form.invalid) {
            this.showError('Faltan campos por añadir');
            this.miscService.endRquest();
            return;
        }
        if (this.enrolledFingersCount === 0) {
            this.showError('Capture al menos una huella');
            this.miscService.endRquest();
            return;
        }

        const formData = this.form.getRawValue();
        const cleanAddresses = this.removeAddressMetadata(formData.peopleAddresses);

        const enrollRequest: EnrollFingerprintRequest = {
            firstName: formData.firstName,
            paternalName: formData.paternalName,
            maternalName: formData.maternalName,
            curp: formData.curp,
            gender: formData.gender,
            maritalStatus: formData.maritalStatus,
            educationLevel: formData.educationLevel,
            occupation: formData.occupation,
            alias: formData.alias,
            birthDate: formData.birthDate,
            peopleAddresses: cleanAddresses,
            fingers: this.enrolledFingers,
        };

        this.fingerprintService.enrollFingerprint(enrollRequest).subscribe({
            next: (response: any) => {
                this.selectPerson(response['object']);
                this.miscService.endRquest();
                this.showSuccess('Persona y huellas enroladas');
            },
            error: (error: any) => {
                this.miscService.endRquest();
                this.showError('Error al enrolar', error.error?.message || error.message);
            },
        });
    }
    // FormArray
    createAddressFormGroup() {
        return this.formBuilder.group({
            address: [null, Validators.required],
            address_data: [null],
        });
    }

    getAddressFormArray(): FormArray {
        return this.form.get('peopleAddresses') as FormArray;
    }

    onAddressSelected(addressData: any, index: number, formArray: FormArray): void {
        if (addressData) {
            formArray.at(index).patchValue({ address: addressData.id, address_data: addressData });
        } else {
            formArray.at(index).patchValue({ address: null, address_data: null });
        }
    }

    addAddressRow(formArray: FormArray): void {
        formArray.push(this.createAddressFormGroup());
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
        return !!(this.enrolledFingers.leftThumb || this.enrolledFingers.leftIndex || this.enrolledFingers.leftMiddle || this.enrolledFingers.leftRing || this.enrolledFingers.leftLittle);
    }

    hasRightHandFingers(): boolean {
        return !!(this.enrolledFingers.rightThumb || this.enrolledFingers.rightIndex || this.enrolledFingers.rightMiddle || this.enrolledFingers.rightRing || this.enrolledFingers.rightLittle);
    }

    // Metodos privados
    private handleSearchResult(result: MatchResult): void {
        this.fingerprintSearchResult = result;
        if (result.requiresConfirmation) {
            this.isAwaitingMatchConfirmation = true;
            this.activeSessionId = result.sessionId || null;
        } else if (result.isMatch) {
            this.isAwaitingMatchConfirmation = false;
        } else {
            this.isAwaitingMatchConfirmation = false;
            this.noMatchWasFound = true;
        }
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
        this.isAwaitingMatchConfirmation = false;
        this.activeSessionId = null;
        this.noMatchWasFound = false;
        // Enrollment
        this.enrolledFingers = {};
        this.enrolledFingersCount = 0;
        // Forms
        this.form.reset();
        this.searchForm.reset();
        this.clearAddressFormArray();
    }

    private clearAddressFormArray(): void {
        const addressArray = this.getAddressFormArray();
        while (addressArray.length > 0) addressArray.removeAt(0);
    }

    private removeAddressMetadata(addresses: any[]): any[] {
        return addresses.map((item: any) => {
            const { address_data, ...addressWithoutMetadata } = item;
            return addressWithoutMetadata;
        });
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
