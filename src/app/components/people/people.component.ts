import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, AbstractControlOptions, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { Address } from '@/api/address';
import { CaptureMode, Segment, SegmentedFinger } from '@/api/realscan';
import { EnrollFingerprintRequest, MatchResult, SearchFingerType } from '@/services/fingerprint.service';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { FingerprintService } from '../../services/fingerprint.service';
import { RealScanService } from '@/services/realscan.service';

export interface TenFingerCapture{
    leftThumb?: string;
    leftIndex?: string;
    leftMiddle?: string;
    leftRing?: string;
    leftLittle?: string;
    rightThumb?: string;
    rightIndex?: string;
    rightMiddle?: string;
    rightRing?: string;
    rightLittle?: string;
}

export type FingerKey = keyof TenFingerCapture;

export interface FingerDef {
    key: FingerKey;
    label: string;
    hand: 'left' | 'right';
}

export type EnrollMode = 'select' | 'full' | 'custom';
interface CaptureQueueItem {
    finger: FingerDef;
    captured?: SegmentedFinger
}

export const All_FINGERS: FingerDef[] = [
    {key: 'leftThumb', label: 'Pulgar Izquierdo', hand: 'left'}, {key: 'rightThumb', label: 'Pulgar derecho', hand: 'right'},
    {key: 'leftIndex', label: 'Indice izquierdo', hand: 'left'}, {key: 'rightIndex', label: 'Indice derecho', hand: 'right'},
    {key: 'leftMiddle', label: 'Medio Izquierdo', hand: 'left'}, {key: 'rightMiddle', label: 'Medio derecho', hand: 'right'},
    {key: 'leftRing', label: 'Anular Izquierdo', hand: 'left'}, {key: 'rightRing', label: 'Anular derecho', hand: 'right'},
    {key: 'leftLittle', label: 'Meñique Izquierdo', hand: 'left'}, {key: 'rightLittle', label: 'Meñique derecho', hand: 'right'}
];

const FINGER_OPTIONS = All_FINGERS.map(f => ({ key: f.key as SearchFingerType, label: f.label, hand: f.hand}));

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
],
    standalone: true
})
export class PeopleComponent implements OnInit {
    people: People;
    private formBuilder = inject(FormBuilder);
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
    formSearch = this.formBuilder.group(
        {
            firstName: [null, [Validators.required, Validators.maxLength(150)]],
            paternalName: [null, Validators.maxLength(150)],
            maternalName: [null, Validators.maxLength(150)],
            curp: [null, Validators.maxLength(18)]
        },
        this.formOptions
    );
    newAddress: null | Address[];

    private peopleService = inject(PeopleService);
    private fingerprintService = inject(FingerprintService);
    public realScanService = inject(RealScanService);

    @Input() set newPeople(value: any) {
        if (value) {
            this.peopleService.getById(value).subscribe(
                (data) => {
                    if (data) {
                        this.people = data;
                        this.form.patchValue(data);
                        this.formSearch.patchValue(data);
                    } else {
                        this.messageService.add({
                            life: 5000,
                            key: 'msg',
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No hay información sobre persona'
                        });
                    }
                },
                (error) => {
                    this.messageService.add({
                        life: 5000,
                        key: 'msg',
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al obtener la persona, error: ' + error.message
                    });
                }
            );
        } else {
            //caso donde se borra el people desde el front
            this.people = null;
            this.form.reset();
            this.formSearch.reset();
        }
    }

    visibleDialog: boolean = false;
    // visibleSearchForm: boolean = true; //true
    // visibleAddForm: boolean = false;
    // visibleList: boolean = false;

    @Output()
    sendPeople = new EventEmitter<People | null>();
    // currentStep: number = 1;
    // steps = 3;
    activeTabValue: string = '0';
    // Tab 1 Busqueda por datos
    dataStep: number = 1;
    page: number = 1;
    limit: number = 10;
    sortBy: [[string, string]] = [['createdAt', 'DESC']];
    totalRows: number = 0;
    listPerson: People[] = [];
    // Tab 2 Busqueda por huellas dactilares
    fpStep: number = 1;
    selectedFinger: SearchFingerType | null = null;
    selectedFingerLabel: string | null = null;
    previewUrl: string | null = null;
    capturedImageBase64: string | null = null;
    isLiveCaptured: boolean = false;
    fpLoading: boolean = false;
    fpSearchResult: MatchResult | null = null;
    fpErrorMessage: string = '';
    fpWaitingConfirmation: boolean = false;
    fpCurrentSessionId: string | null = null;
    fpThreshold: number = 40;
    fpHighConfidenceThreshold: number = 100;
    fpNoMatchFound: boolean = false;
    //Dialog para captura en busqueda
    captureDialogVisible: boolean = false;
    capturedFinger: SegmentedFinger | null = null;
    captureImageFormat: string = 'bmp';
    //Enrolamiento
    enrollDialogVisible: boolean = false
    enrollMode: EnrollMode = 'select';
    fpEnrollFingers: TenFingerCapture = {};
    enrollFingersCount: number = 0;
    fullStep: 'left-four' | 'left-thumb' | 'right-four' | 'right-thumb' = 'left-four';
    leftFourFingers: SegmentedFinger[] = [];
    leftThumb: SegmentedFinger | null = null;
    rightFourFingers: SegmentedFinger[] = [];
    rightThumb: SegmentedFinger | null = null;
    leftThumbFormat: string = 'bmp';
    rightThumbFormat: string = 'bmp';
    selectedKeys: Set<FingerKey> = new Set();
    captureQueue: CaptureQueueItem[] = [];
    currentQueueIndex: number = 0;
    customImageFormat: string = 'bmp';

    readonly fullStepItems = [
        {step: 'left-four' as const, label: '4 izquierdos'},
        {step: 'left-thumb' as const, label: 'Pulgar izquierdo'},
        {step: 'right-four' as const, label: '4 derechos'},
        {step: 'right-thumb' as const, label: 'Pulgar derecho'}
    ];
    readonly leftFingerNames = ['Indice', 'Medio', 'Anular', 'Meñique'];
    readonly rightFingerNames = ['Meñique', 'Anular', 'Medio', 'Indice'];
    readonly leftFingerDefs = All_FINGERS.filter(f => f.hand === 'left');
    readonly rightFingerDefs = All_FINGERS.filter(f => f.hand === 'right');

    listGender: any[] = [
        { label: 'Femenino', value: 'femenino' },
        { label: 'Masculino', value: 'masculino' }
    ];
    listSex: any[] = [];
    listDegreeStudy: any[] = [
        {
            label: 'NIVEL BASICO',
            items: [
                { label: 'Primaria', value: 'primaria' },
                { label: 'Secundaria', value: 'secuendaria' }
            ]
        },
        {
            label: 'NIVEL MEDIO SUPERIOR',
            items: [{ label: 'Bachillerato', value: 'bachillerato' }]
        },
        {
            label: 'NIVEL SUPERIOR',
            items: [
                { label: 'Licenciatura', value: 'licenciatura' },
                { label: 'Especialidad', value: 'especialidad' },
                { label: 'Maestría', value: 'maestria' },
                { label: 'Doctorado', value: 'doctorado' }
            ]
        }
    ];
    listCivilStatus: any[] = [
        { label: 'Soltero', value: 'soltero' },
        { label: 'Casado', value: 'casado' },
        { label: 'Divorciado', value: 'divorciado' },
        { label: 'Viudo', value: 'viudo' }
    ];
    filter = {};
    searchFields = [
        { id: 'firstName', controlName: 'firstName', label: 'Nombres', maxLength: 50 },
        { id: 'paternalName', controlName: 'paternalName', label: 'Apellido Paterno', maxLength: 50 },
        { id: 'maternalName', controlName: 'maternalName', label: 'Apellido Materno', maxLength: 50 },
        { id: 'curp', controlName: 'curp', label: 'CURP', maxLength: 18 }
    ];
    addFields = [
        { id: 'firstName', controlName: 'firstName', label: 'Nombres', maxLength: 150, type: 'text' },
        { id: 'paternalName', controlName: 'paternalName', label: 'Apellido Paterno', maxLength: 150, type: 'text' },
        { id: 'maternalName', controlName: 'maternalName', label: 'Apellido Materno', maxLength: 150, type: 'text' },
        { id: 'gender', controlName: 'gender', label: 'Género', type: 'list', options: this.listGender },
        { id: 'alias', controlName: 'alias', label: 'Alias', maxLength: 150, type: 'text' },
        { id: 'maritalStatus', controlName: 'maritalStatus', label: 'Estado Civil', type: 'list', options: this.listCivilStatus },
        { id: 'birthDate', controlName: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
        { id: 'educationLevel', controlName: 'educationLevel', label: 'Nivel de educación', type: 'list', group: true, maxLength: 50, options: this.listDegreeStudy },
        { id: 'occupation', controlName: 'occupation', label: 'Ocupación', maxLength: 50, type: 'text' },
        { id: 'curp', controlName: 'curp', label: 'CURP', maxLength: 18, type: 'text' }
    ];

    readonly fingerOptions = FINGER_OPTIONS;
    readonly leftFingerOptions = FINGER_OPTIONS.filter(f => f.hand === 'left');
    readonly rightFingerOptions = FINGER_OPTIONS.filter(f => f.hand === 'right');
    readonly leftFingerItems: {key: FingerKey, label: string}[] =
    [
        {key: 'leftThumb', label: 'Pulgar'},
        {key: 'leftIndex', label: 'Indice'},
        {key: 'leftMiddle', label: 'Medio'},
        {key: 'leftRing', label: 'Anular'},
        {key: 'leftLittle', label: 'Meñique'}
    ];
    readonly rightFingerItems: {key: FingerKey, label: string}[] =
    [
        {key: 'rightThumb', label: 'Pulgar'},
        {key: 'rightIndex', label: 'Indice'},
        {key: 'rightMiddle', label: 'Medio'},
        {key: 'rightRing', label: 'Anular'},
        {key: 'rightLittle', label: 'Meñique'}
    ];

    constructor(
        private messageService: MessageService,
        private miscService: MiscService,
        private datePipe: DatePipe,
        private changeDetector: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.listSex = [
            { label: 'Hombre', value: 'hombre' },
            { label: 'mujer', value: 'mujer' }
        ];
        this.listDegreeStudy = [
            {
                label: 'NIVEL BASICO',
                items: [
                    { label: 'Primaria', value: 'primaria' },
                    { label: 'Secundaria', value: 'secuendaria' }
                ]
            },
            {
                label: 'NIVEL MEDIO SUPERIOR',
                items: [{ label: 'Bachillerato', value: 'bachillerato' }]
            },
            {
                label: 'NIVEL SUPERIOR',
                items: [
                    { label: 'Licenciatura', value: 'licenciatura' },
                    { label: 'Especialidad', value: 'especialidad' },
                    { label: 'Maestría', value: 'maestria' },
                    { label: 'Doctorado', value: 'doctorado' }
                ]
            }
        ];
    }
    // Dialog principal
    openDialog(){
        this.activeTabValue = '0';
        this.resetAllState();
        this.visibleDialog = true;
        this.changeDetector.detectChanges();
    }
    onTabChange(value: string | number){
        this.activeTabValue = String(value);
        this.resetAllState();
        this.changeDetector.detectChanges();
    }
    //Tab 1
    newPeopleAddress() {
        return this.formBuilder.group({
            address: [null, Validators.required],
            address_data:[null]
        });
    }
    getPeopleAddressArray(): FormArray {
        return this.form.get('peopleAddresses') as FormArray;
    }
    getAddresses(data: any, index: number, array: FormArray) {
        if (data) {
            array.at(index).patchValue({
                address: data.id,
                address_data: data
            });
        } else {
            array.at(index).patchValue({
                address: null,
                address_data: null,
            });
        }
    }
    addRow(array: any, newRow: any) {
        array.push(newRow);
    }
    removeRow(array: FormArray, index: number) {
        array.removeAt(index);
    }
    selectPerson(person) {
        this.people = person;
        //se envía el dato al componente padre
        this.sendPeople.emit(person);
        this.dataStep= 1;
        // this.resetSteps();
        this.visibleDialog = false;
    }
    searchPerson() {
        this.filter = {};
        if (!this.formSearch.invalid) {
            this.miscService.startRequest();
            this.dataStep = 2;
            // this.nextStep();
            for (const key in this.formSearch.value) {
                if (this.formSearch.controls[key].value != null && this.formSearch.controls[key].value != '') {
                    this.filter[key] = '$ilike:' + this.formSearch.value[key];
                }
            }
        } else {
            this.miscService.endRquest();
            this.messageService.add({ life: 5000, key: 'msg', severity: 'warn', summary: 'Nombre es dato obligatorio para busqueda' });
        }
    }

    addPerson() {
        this.form.controls.curp.setValue(this.formSearch.controls.curp.value);
        this.form.controls.firstName.setValue(this.formSearch.controls.firstName.value);
        this.form.controls.paternalName.setValue(this.formSearch.controls.paternalName.value);
        this.form.controls.maternalName.setValue(this.formSearch.controls.maternalName.value);
        // this.nextStep();
        this.dataStep = 3;
    }

    saveForm() {
        this.miscService.startRequest();
        if (this.form.invalid) {
            this.messageService.add({ severity: 'error', key: 'msg', summary: 'Faltan campos por añadir en el formulario', life: 3000 });
            this.miscService.endRquest();
            return;
        }
        const rawData = this.form.getRawValue();

        // Iteramos sobre las direcciones para quitar 'address_data'
        const cleanAddresses = rawData.peopleAddresses.map((item: any) => {
            const { address_data, ...rest } = item; // Desestructuración: extrae address_data y deja el resto
            return rest;
        });

        const finalData = {
            ...rawData,
            peopleAddresses: cleanAddresses
        };

        this.peopleService.create(finalData).subscribe(
            (data: any) => {
                this.selectPerson(data['object']);
                this.miscService.endRquest();
                this.messageService.add({ severity: 'success', key: 'msg', summary: 'Operación exitosa', life: 3000 });
            },
            (error: any) => {
                this.miscService.endRquest();
                this.messageService.add({ life: 5000, key: 'msg', severity: 'error', summary: 'Error al guardar registro de persona', detail: error.error.message });
            }
        );
    }
    // getDialogHeader(): string {
    //     switch (this.currentStep) {
    //         case 1:
    //             return 'Buscar persona';
    //         case 2:
    //             return 'Seleccionar Persona';
    //         default:
    //             return 'Agregar persona';
    //     }
    // }
    // getNextButtonLabel(): string {
    //     switch (this.currentStep) {
    //         case 1:
    //             return 'Buscar';
    //         case 2:
    //             return 'Agregar';
    //         default:
    //             return 'Guardar';
    //     }
    // }
    // nextStep(): void {
    //     if (this.currentStep < 3) {
    //         this.currentStep++;
    //         this.updateVisibility();
    //     }
    // }
    // previousStep(): void {
    //     if (this.currentStep > 1) {
    //         this.currentStep--;
    //         this.updateVisibility();
    //     }
    // }
    // resetSteps(): void {
    //     this.currentStep = 1;
    //     this.updateVisibility();
    // }
    // updateVisibility(): void {
    //     this.visibleSearchForm = this.currentStep === 1;
    //     this.visibleList = this.currentStep === 2;
    //     this.visibleAddForm = this.currentStep === 3;
    // }
    deletePeople() {
        this.people = null;
        this.sendPeople.emit(this.people);
        this.newPeople = null;
    }
    loadTable(event: TableLazyLoadEvent) {
        this.page = event.first / event.rows + 1;
        this.limit = event.rows;
        this.peopleService.getList(this.limit, this.page, this.sortBy, this.filter).subscribe(
            async (data: any) => {
                if (data['meta']['totalItems'] != 0) {
                    this.listPerson = data['data'];
                    this.totalRows = data['meta']['totalItems'];
                    // this.miscService.endRquest();
                } else {
                    // No hay resultados o formato inesperado
                    this.listPerson = [];
                    this.totalRows = 0;
                    this.messageService.add({
                        life: 5000,
                        key: 'msg',
                        severity: 'warn',
                        summary: 'No se encontraron personas'
                    });
                }
                this.miscService.endRquest();
            },
            (error: any) => {
                this.listPerson = [];
                this.totalRows = 0;
                this.miscService.endRquest();
                this.messageService.add({
                    life: 5000,
                    key: 'msg',
                    severity: 'error',
                    summary: 'Error al buscar el personas',
                    detail: error.error?.message || 'Error desconocido'
                });
            }
        );
    }
    // Tab 2 - Busqueda por huellas dactilares
    selectFinger(key: SearchFingerType): void{
        this.selectedFinger = key;
        this.selectedFingerLabel = FINGER_OPTIONS.find(f => f.key === key)?.label ?? null;
        this.fpSearchResult = null;
        this.fpErrorMessage = '';
        this.resetFpConfirmation();
    }
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
        this.onFpImageCaptured(this.capturedFinger.imageBase64);
        this.closeCaptureDialog();
    }
    getCaptureImageUrl(): string | null{
        return this.capturedFinger ? `data:image/${this.captureImageFormat};base64,${this.capturedFinger.imageBase64}` : null;
    }
    onCaptureImgError(): void{
        this.captureImageFormat = this.captureImageFormat === 'bmp' ? 'png' : this.captureImageFormat === 'png' ? 'jpg' : 'bmp';
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
    onFpImageCaptured(imageBase64: string): void{
        this.fpSearchResult = null;
        this.fpErrorMessage = '';
        this.resetFpConfirmation();
        this.isLiveCaptured = true;
        this.capturedImageBase64 = imageBase64;
        this.previewUrl = `data:image/bmp;base64,${imageBase64}`;
    }
    onFpFileSelected(event: Event): void{
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if(!file) return;
        if(!['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'].includes(file.type.toLowerCase())){
            this.fpErrorMessage = 'Formato Invalido';
            input.value = '';
            return;
        }
        this.fpSearchResult = null;
        this.fpErrorMessage = '';
        this.resetFpConfirmation();
        this.isLiveCaptured = false;
        const reader = new FileReader();
        reader.onload = e => {
            if(e.target?.result){
                const d = e.target.result as string;
                this.previewUrl = d;
                this.capturedImageBase64 = d.split(',')[1];
            }
        };
        reader.readAsDataURL(file);
        input.value = '';
    }
    async searchFingerprint(): Promise<void>{
        if(!this.capturedImageBase64){
            this.fpErrorMessage = 'Capture o seleccione imagen';
            return;
        }
        if(!this.selectFinger){
            this.fpErrorMessage = 'Seleccione el dedo';
            return;
        }
        this.fpLoading = true;
        this.fpSearchResult = null;
        this.fpErrorMessage = '';
        this.resetFpConfirmation();
        this.fpNoMatchFound = false;
        this.fingerprintService.searchFingerprint({
            fingerprintImage: this.capturedImageBase64,
            threshold: this.fpThreshold,
            highConfidenceThreshold: this.fpHighConfidenceThreshold,
            fingerType: this.selectedFinger
        })
        .subscribe({
            next: (r) => {
                this.handleFpSearchResult(r);
                this.fpLoading = false;
            },
            error: (e) => {
                this.fpErrorMessage = e.message || 'Error';
                this.fpLoading = false;
            }
        });
    }
    handleFpSearchResult(result: MatchResult): void{
        this.fpSearchResult = result;
        if(result.requiresConfirmation){
            this.fpWaitingConfirmation = true;
            this.fpCurrentSessionId = result.sessionId || null;
        }else if(result.isMatch){
            this.fpWaitingConfirmation = false;
        }
        else{
            this.fpWaitingConfirmation = false;
            this.fpNoMatchFound = true;
        }
    }
    confirmFpMatch(isCorrect: boolean): void{
        const sid = this.fpCurrentSessionId;
        if(!sid){
            this.fpErrorMessage = 'No hay sesion';
            return;
        }
        this.fpLoading = true;
        this.fingerprintService.confirmMatch({
            sessionId: sid,
            isCorrect
        })
        .subscribe({
            next: (r) => {
                if(isCorrect){
                    this.fpSearchResult = r;
                    this.fpWaitingConfirmation = false;
                    if(r.peopleId){
                        this.peopleService.getById(r.peopleId)
                        .subscribe(p => {
                            if(p) this.selectPerson(p);
                        });
                    }
                } else {
                    this.handleFpSearchResult(r);
                }
                this.fpLoading = false;
            },
            error: (e) => {
                this.fpErrorMessage = e.message || 'Error';
                this.fpLoading = false;
                this.fpWaitingConfirmation = false;
            }
        });
    }
    // Limpiar todo al agregar persona
    goToFpAddPerson(): void{
        // Limpiar huellas
        this.fpEnrollFingers = {};
        this.enrollFingersCount = 0;
        this.resetEnrollState();
        // Limpiar formulario de persona
        this.form.reset();
        const arr = this.getPeopleAddressArray();
        while(arr.length > 0) arr.removeAt(0);
        this.fpStep = 3;
    }
    fpGoBack(): void{
        if(this.fpStep === 3){
            this.fpStep = 1;
        }
    }
    // Dialog enrolamiento de huellas
    openEnrollDialog(): void{
        this.enrollMode = 'select';
        this.resetEnrollState();
        this.realScanService.clearError();
        this.enrollDialogVisible = true;
    }
    closeEnrollDialog(): void{
        this.enrollDialogVisible = false;
        if(this.realScanService.deviceHandle()) this.realScanService.exitAllDevices().subscribe();
    }
    chooseFullMode(): void{
        this.enrollMode = 'full';
        this.resetFullMode();
    }
    chooseCustomMode(): void{
        this.enrollMode = 'custom';
        this.selectedKeys = new Set();
    }
    backToEnrollSelect(): void{
        this.enrollMode = 'select';
        this.resetEnrollState();
        this.realScanService.clearError();
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
            error: e => console.error(e)
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
            error: e => console.error(e)
        });
    }
    captureLeftThumbEnroll(): void{
        this.leftThumb = null;
        this.leftThumbFormat = 'bmp';
        this.realScanService.clearError();
        this.realScanService.quickCapture(CaptureMode.FLAT_SINGLE_FINGER, 10000, Segment.ENABLED)
        .subscribe({
            next: r => {
                if(!r.success){
                    this.realScanService.lastError.set(r.message || 'Error');
                    return;
                }
                const s = r.fingers?.length ? r.fingers[0] : r.imageBase64 ? {
                    fingerIndex: 1,
                    fingerType: 0,
                    fingerTypeName: 'Thumb',
                    width: r.width ?? 0,
                    height: r.height ?? 0,
                    imageBase64: r.imageBase64
                }
                : null;
                if(s){
                    this.rightThumb = s;
                }else {
                    this.realScanService.lastError.set('No se recibio imagen');
                }
            },
            error: e => console.error(e)
        });
    }
    captureRightThumbEnroll(): void{
        this.rightThumb = null;
        this.rightThumbFormat = 'bmp';
        this.realScanService.clearError();
        this.realScanService.quickCapture(CaptureMode.FLAT_SINGLE_FINGER, 10000, Segment.ENABLED)
        .subscribe({
            next: r => {
                if(!r.success){
                    this.realScanService.lastError.set(r.message || 'Error');
                    return;
                }
                const s = r.fingers?.length ? r.fingers[0] : r.imageBase64 ?
                {
                    fingerIndex: 1,
                    fingerType: 0,
                    fingerTypeName: 'Thumb',
                    width: r.width ?? 0,
                    height: r.height ?? 0,
                    imageBase64: r.imageBase64
                } : null;
                if(s){
                    this.rightThumb = s;
                }
                else {
                    this.realScanService.lastError.set('No se recibio imagen');
                }
            },
            error: e => console.error(e)
        });
    }
    acceptLeftFour(): void{
        if(this.leftFourFingers.length > 0){
            this.fullStep = 'left-thumb';
            this.realScanService.clearError();
        }
    }
    acceptLeftThumbEnroll(): void{
        if(this.leftThumb){
            this.fullStep = 'right-four';
            this.realScanService.clearError();
        }
    }
    acceptRightFour(): void{
        if(this.rightFourFingers.length > 0){
            this.fullStep = 'right-thumb';
            this.realScanService.clearError();
        }
    }
    retakeLeftFour(): void{
        this.leftFourFingers = [];
        this.realScanService.clearError();
    }
    retakeLeftThumbEnroll(): void{
        this.leftThumb = null;
        this.leftThumbFormat = 'bmp';
        this.realScanService.clearError();
    }
    retakeRightFour(): void{
        this.rightFourFingers = [];
        this.realScanService.clearError();
    }
    retakeRightThumbEnroll(): void{
        this.rightThumb = null;
        this.rightThumbFormat = 'bmp';
        this.realScanService.clearError();
    }
    getLeftThumbUrl(): string | null{
        return this.leftThumb ? `data:image/${this.leftThumbFormat};base64,${this.leftThumb.imageBase64}` : null;
    }
    getRightThumbUrl(): string | null{
        return this.rightThumb ? `data:image/${this.rightThumbFormat};base64,${this.rightThumb.imageBase64}` : null;
    }
    onLeftThumbImgError(): void{
        this.leftThumbFormat = this.leftThumbFormat === 'bmp' ? 'png' : 'jpg';
    }
    onRightThumbImgError(): void{
        this.rightThumbFormat = this.rightThumbFormat === 'bmp' ? 'png' : 'jpg';
    }
    isFullStepDone(step: string): boolean{
        const order = ['left-four', 'left-thumb', 'right-four', 'right-thumb'];
        return order.indexOf(step) < order.indexOf(this.fullStep);
    }
    acceptRightThumbAndFinish(): void{
        const lf = this.leftFourFingers, lt = this.leftThumb, rf = this.rightFourFingers, rt = this.rightThumb;
        if(lf.length < 1 || !lt || rf.length < 1 || !rt){
            this.realScanService.lastError.set('Complete todos los pasos');
            return;
        }
        const result: TenFingerCapture = {
            leftThumb: lt.imageBase64,
            rightThumb: rt.imageBase64
        };
        for(const f of lf){
            switch(f.fingerType){
                case 7:
                    result.leftIndex = f.imageBase64;
                    break;
                case 8:
                    result.leftMiddle = f.imageBase64;
                    break;
                case 9:
                    result.leftRing = f.imageBase64;
                    break;
                case 10:
                    result.leftLittle = f.imageBase64;
                    break;
            }
        }
        for(const f of rf){
            switch(f.fingerType){
                case 2:
                    result.rightIndex = f.imageBase64;
                    break;
                case 3:
                    result.rightMiddle = f.imageBase64;
                    break;
                case 4:
                    result.rightRing = f.imageBase64;
                    break;
                case 5:
                    result.rightLittle = f.imageBase64;
                    break;
            }
        }
        const lu = lf.filter(f => !f.fingerType), ru = rf.filter(f => !f.fingerType);
        if(lu.length){
            (['leftLittle', 'leftRing', 'leftMiddle', 'leftIndex'] as FingerKey[])
            .forEach((k, i) => {
                if(lu[i] && !result[k]){
                    result[k] = lu[i].imageBase64;
                }
            });
            this.fpEnrollFingers  = result;
            this.enrollFingersCount = Object.values(result).filter(v => v).length;
            this.closeEnrollDialog();
        }
    }
    toggleFingerKey(key: FingerKey): void{
        if(this.selectedKeys.has(key)){
            this.selectedKeys.delete(key);
        }else {
            this.selectedKeys.add(key);
        }
    }
    isFingerKeySelected(key: FingerKey): boolean{
        return this.selectedKeys.has(key);
    }
    selectAllFingers(): void{
        this.selectedKeys = new Set(All_FINGERS.map(f => f.key));
    }
    clearFingerSelection(): void{
        this.selectedKeys = new Set();
    }
    startCustomCapture(): void{
        if(this.selectedKeys.size === 0){
            this.realScanService.lastError.set('Selecciona al menos un dedo');
            return;
        }
        this.captureQueue = All_FINGERS.filter(f => this.selectedKeys.has(f.key))
        .map(f => ({
            finger: f
        }));
        this.currentQueueIndex = 0;
        this.customImageFormat = 'bmp';
        this.realScanService.clearError();
    }
    getCurrentQueueItem(): CaptureQueueItem | null{
        return this.captureQueue[this.currentQueueIndex] ?? null;
    }
    getCurrentQueueImageUrl(): string | null{
        const item = this.getCurrentQueueItem();
        return item?.captured ? `data:image/${this.customImageFormat};base64,${item.captured.imageBase64}` : null;
    }
    onCustomImgError(): void{
        this.customImageFormat = this.customImageFormat === 'bmp' ? 'png' : this.customImageFormat === 'png' ? 'jpg' : 'bmp';
    }
    captureCurrentFinger(): void{
        const item = this.getCurrentQueueItem();
        if(!item) return;
        this.updateQueueItem(undefined);
        this.customImageFormat = 'bmp';
        this.realScanService.clearError();
        this.realScanService.quickCapture(CaptureMode.FLAT_SINGLE_FINGER, 12000, Segment.ENABLED)
        .subscribe({
            next: r => {
                if(!r.success){
                    this.realScanService.lastError.set(r.message || 'Error');
                    return;
                }
                let seg: SegmentedFinger | null = null;
                if(r.fingers?.length){
                    seg = r.fingers[0];
                } else if(r.imageBase64){
                    seg = {
                        fingerIndex: 1,
                        fingerType: 0,
                        fingerTypeName: item.finger.label,
                        width: r.width ?? 0,
                        height: r.height ?? 0,
                        imageBase64: r.imageBase64
                    };
                }
                if(seg){
                    this.updateQueueItem(seg);
                }else{
                    this.realScanService.lastError.set('No se recibio imagen');
                }
            },
            error: e => console.error(e)
        })
    }
    retakeCurrentFinger(): void{
        this.updateQueueItem(undefined);
        this.customImageFormat = 'bmp';
        this.realScanService.clearError();
    }
    acceptCurrentFinger(): void{
        const item = this.captureQueue[this.currentQueueIndex];
        if(!item?.captured) return;
        if(this.currentQueueIndex + 1 < this.captureQueue.length){
            this.currentQueueIndex++;
            this.customImageFormat = 'bmp';
            this.realScanService.clearError();
        }else{
            this.finishCustomCapture();
        }
    }
    private updateQueueItem(captured: SegmentedFinger | undefined): void{
        this.captureQueue = this.captureQueue.map((it, i) => i === this.currentQueueIndex ?
        {...it, captured} : it);
    }
    private finishCustomCapture(): void{
        const r: TenFingerCapture = {};
        for(const item of this.captureQueue){
            if(item.captured) (r as any)[item.finger.key] = item.captured.imageBase64;
        }
        this.fpEnrollFingers = {
            ...this.fpEnrollFingers,
            ...r
        };
        this.enrollFingersCount = Object.values(this.fpEnrollFingers).filter(v => v).length;
        this.closeEnrollDialog();
    }

    private resetFullMode(): void{
        this.fullStep = 'left-four';
        this.leftFourFingers = [];
        this.leftThumb = null;
        this.rightFourFingers = [];
        this.rightThumb = null;
        this.leftThumbFormat = 'bmp';
        this.rightThumbFormat = 'bmp';
    }
    private resetEnrollState(): void{
        this.resetFullMode();
        this.selectedKeys = new Set();
        this.captureQueue = [];
        this.currentQueueIndex = 0;
        this.customImageFormat = 'bmp';
    }

    saveFpForm(): void{
        this.miscService.startRequest();
        if(this.form.invalid){
            this.messageService.add({
                severity: 'error',
                key: 'msg',
                summary: 'Faltan campos por llenar',
                life: 3000
            });
            this.miscService.endRquest();
            return;
        }
        if(this.enrollFingersCount === 0){
            this.messageService.add({
                severity: 'error',
                key: 'msg',
                summary: 'Capture al menos una huella',
                life: 3000
            });
            this.miscService.endRquest();
            return;
        }
        const rawData = this.form.getRawValue();
        const cleanAddresses = rawData.peopleAddresses.map((item: any) => {
            const {address_data, ...rest} = item;
            return rest;
        });
        const req: EnrollFingerprintRequest = {
            firstName: rawData.firstName,
            paternalName: rawData.paternalName,
            maternalName: rawData.maternalName,
            curp: rawData.curp,
            gender: rawData.gender,
            maritalStatus: rawData.maritalStatus,
            educationLevel: rawData.educationLevel,
            occupation: rawData.occupation,
            alias: rawData.alias,
            birthDate: rawData.birthDate,
            peopleAddress: cleanAddresses,
            fingers: this.fpEnrollFingers
        };
        this.fingerprintService.enrollFingerprint(req)
        .subscribe(
            (data: any) => {
                this.selectPerson(data['object']);
                this.miscService.endRquest();
                this.messageService.add({
                    severity: 'success',
                    key: 'msg',
                    summary: 'Persona y huellas enroladas',
                    life: 3000
                });
            },
            (error: any) => {
                this.miscService.endRquest();
                this.messageService.add({
                    life: 5000,
                    key: 'msg',
                    severity: 'Error al enrolar',
                    detail: error.error?.message || error.message
                });
            }
        );
    }
    // Tab
    getPageRange(page, limit, totalRows) {
        var startIndex = 0;
        var endIndex = 0;
        if (totalRows > 0) {
            startIndex = (page - 1) * limit + 1;
            endIndex = Math.min(startIndex + limit - 1, totalRows);
        }
        return `Mostrando del ${startIndex} al ${endIndex} de ${totalRows} registros`;
    }
    private resetAllState(): void {
        // Tab 1
        this.dataStep = 1;
        this.filter = {},
        this.listPerson = [];
        this.totalRows = 0;
        // Tab 2
        this.fpStep = 1;
        this.selectedFinger = null;
        this.selectedFingerLabel = null,
        this.previewUrl = null;
        this.capturedImageBase64 = null;
        this.isLiveCaptured = false;
        this.fpLoading = false;
        this.fpSearchResult = null,
        this.fpErrorMessage = '';
        this.fpWaitingConfirmation = false;
        this.fpCurrentSessionId = null;
        this.fpNoMatchFound = false;
        //Enrolamiento completo
        this.fpEnrollFingers = {};
        this.enrollFingersCount = 0;
        // this.resetEnrollState();
        //Formularios
        this.form.reset();
        this.formSearch.reset();
        //Limpiar FormArray de direcciones
        const arr = this.getPeopleAddressArray();
        while(arr.length > 0) arr.removeAt(0);
    }
    resetFpConfirmation(): void{
        this.fpWaitingConfirmation = false;
        this.fpCurrentSessionId = null;
    }
    getDialogHeader(): string{
        return 'Buscar Persona';
    }
    dataPreviousStep(): void{
        if(this.dataStep > 1) this.dataStep--;
    }
    getScoreColor(score: number): string{
        if(score >= 100) return 'text-green-600';
        if(score >= 60) return 'text-blue-600';
        if(score >= 40) return 'text-yellow-600';
        return 'text-red-600';
    }
    formatTime(ms: number): string{
        if(!ms || ms <= 0) return '0ms';
        if(ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`
    }
    getFingerImage(key: FingerKey): string{
        return this.fpEnrollFingers?.[key] ?? '';
    }
}
