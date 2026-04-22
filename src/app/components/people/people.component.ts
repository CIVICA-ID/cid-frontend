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
import { DateTimePickerComponent } from '@/components/date-time-picker/date-time-picker.component';

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
        DateTimePickerComponent
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
    visibleSearchForm: boolean = true; //true
    visibleAddForm: boolean = false;
    visibleList: boolean = false;

    @Output()
    sendPeople = new EventEmitter<People | null>();
    currentStep: number = 1;
    steps = 3;

    page: number = 1;
    limit: number = 10;
    sortBy: [[string, string]] = [['createdAt', 'DESC']];
    totalRows: number = 0;
    listPerson: People[] = [];
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

    constructor(
        private messageService: MessageService,
        public miscService: MiscService,
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
    newPeopleAddress() {
        return this.formBuilder.group({
            address: [null, Validators.required],
            address_data: [null]
        });
    }
    getPeopleAddressArray(): FormArray {
        return this.form.get('peopleAddresses') as FormArray;
    }
    openDialog() {
        this.visibleDialog = true;
        this.changeDetector.detectChanges();
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
                address_data: null
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
        this.resetSteps();
        this.visibleDialog = false;
    }
    searchPerson() {
        this.filter = {};
        if (!this.formSearch.invalid) {
            this.miscService.startRequest();
            this.nextStep();
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
        this.nextStep();
    }

    saveForm() {
        if (this.miscService.loading) {
            return;
        }
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
    getDialogHeader(): string {
        switch (this.currentStep) {
            case 1:
                return 'Buscar persona';
            case 2:
                return 'Seleccionar Persona';
            default:
                return 'Agregar persona';
        }
    }
    getNextButtonLabel(): string {
        switch (this.currentStep) {
            case 1:
                return 'Buscar';
            case 2:
                return 'Agregar';
            default:
                return 'Guardar';
        }
    }
    nextStep(): void {
        if (this.currentStep < 3) {
            this.currentStep++;
            this.updateVisibility();
        }
    }
    previousStep(): void {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateVisibility();
        }
    }
    resetSteps(): void {
        this.currentStep = 1;
        this.updateVisibility();
    }
    updateVisibility(): void {
        this.visibleSearchForm = this.currentStep === 1;
        this.visibleList = this.currentStep === 2;
        this.visibleAddForm = this.currentStep === 3;
    }
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
                    this.miscService.endRquest();
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
                    this.miscService.endRquest();
                }
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
    getPageRange(page, limit, totalRows) {
        var startIndex = 0;
        var endIndex = 0;
        if (totalRows > 0) {
            startIndex = (page - 1) * limit + 1;
            endIndex = Math.min(startIndex + limit - 1, totalRows);
        }
        return `Mostrando del ${startIndex} al ${endIndex} de ${totalRows} registros`;
    }
}
