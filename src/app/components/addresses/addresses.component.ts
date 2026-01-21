import { ChangeDetectorRef, Component, computed, effect, EventEmitter, inject, Input, isSignal, OnChanges, OnInit, Output, Signal, SimpleChanges } from '@angular/core';
import { AbstractControlOptions, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MiscService } from '@/services/misc.service';
import { AddressService } from '@/services/address.service';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { StateService } from '@/services/states.service';
import { State } from '@/api/state';
import { DatePickerModule } from 'primeng/datepicker';
import { Checkbox } from 'primeng/checkbox';
import { toSignal } from '@angular/core/rxjs-interop';
import { Address } from '@/api/address';
import { CountriesService } from '@/services/country.service';
import { Country } from '@/api/country';

@Component({
    selector: 'app-addresses',
    templateUrl: './addresses.component.html',
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, DialogModule, ReactiveFormsModule, InputNumberModule, TableModule, SelectModule, DatePickerModule, InputNumberModule, Checkbox],
    standalone: true
})
export class AddressesComponent implements OnInit {
    address: any;
    visibleDialog: boolean = false;
    visibleAddForm: boolean = true;
    visibleList: boolean = false;
    visibleConfirmation: boolean = false;
    private formBuilder = inject(FormBuilder);
    formOptions: AbstractControlOptions = { validators: Validators.nullValidator };
    form: FormGroup | any = this.formBuilder.group(
        {
            street: [null, Validators.required],
            internalNumber: [null],
            externalNumber: [null],
            colony: [null],
            cross1: [null],
            cross2: [null],
            region: [null],
            municipality: [null],
            state: [null],
            operationalArea: [null],
            place: [null],
            principal: [false],
            country: [null],
            type: ['Domicilio']
        },
        this.formOptions
    );
    @Input() set newAddress(value: any) {
        if (value) {
            this.address = value;
            this.form.patchValue(value);
            value=null;
        } else {
            this.address = null;
            this.form.reset({
                type:"Domicilio",
                principal:false
            });
        }
    }
    fullAddress: string = '';
    addresses = [];
    @Output()
    sendAddress = new EventEmitter<Address>();
    currentStep: number = 1;
    steps = 3;
    zoom = 15;
    page: number = 1;
    sortBy: [[string, string]] = [['createdAt', 'DESC']];
    totalRows: number = 0;
    limit: number = 10;
    currentSearch: string = '';
    isLoadingAddresses: boolean = false;
    municipalitiesList = [];
    statesList = [];
    countriesList: { label: string; value: string }[] = [];
    selectedState: string = '';
    fields = [];
    typeAddressList = [
        { label: 'Domicilio', value: 'Domicilio' },
        { label: 'Lugar', value: 'Lugar' }
    ];
    stateValue = toSignal<string | null>(this.form.get('state')!.valueChanges, {
        initialValue: this.form.get('state')?.value
    });
    filter = {};
    municipalitiesSignal: Signal<any> = computed(() => {
        const stateId = this.stateValue();
        if (stateId && this.municipalitiesList[stateId]) {
            return this.municipalitiesList[stateId];
        }
        return [];
    });
    //controlar si el control está habilitado o no dependiendo del valor de states
    manageMunicipalityStatus = effect(() => {
        const lista = this.municipalitiesSignal();
        const control = this.form.get('municipality');
        if (lista && lista.length > 0) {
            control?.enable({ emitEvent: false });
        } else {
            control?.disable({ emitEvent: false });
            control?.setValue(null, { emitEvent: false });
        }
    });
    listAddresses: Address[];
    constructor(
        private messageService: MessageService,
        private miscService: MiscService,
        private addressService: AddressService,
        private changeDetector: ChangeDetectorRef,
        private stateService: StateService,
        private countryService: CountriesService
    ) {}
    ngOnInit(): void {
        this.getLists();
    }
    initFields() {
        this.fields = [
            { id: 'street', controlName: 'street', label: 'Calle', maxLength: 150, type: 'text' },
            { id: 'internalNumber', controlName: 'internalNumber', label: 'Número interno', type: 'number' },
            { id: 'externalNumber', controlName: 'externalNumber', label: 'Número externo', type: 'number' },
            { id: 'cross1', controlName: 'cross1', label: 'Cruce 1', maxLength: 150, type: 'text' },
            { id: 'cross2', controlName: 'cross2', label: 'Cruce 2', maxLength: 150, type: 'text' },
            { id: 'state', controlName: 'state', label: 'Estado', maxLength: 150, type: 'list', options: this.statesList },
            { id: 'municipality', controlName: 'municipality', label: 'Municipios', maxLength: 150, type: 'list', options: this.municipalitiesSignal },
            { id: 'region', controlName: 'region', label: 'Region', maxLength: 150, type: 'text' },
            { id: 'colony', controlName: 'colony', label: 'Colonia', maxLength: 150, type: 'text' },
            { id: 'country', controlName: 'country', label: 'País', maxLength: 100, type: 'list', options: this.countriesList },
            { id: 'operationalArea', controlName: 'operationalArea', label: 'Área Operativa', maxLength: 150, type: 'text' },
            { id: 'place', controlName: 'place', label: 'Lugar', maxLength: 150, type: 'text' },
            { id: 'principal', controlName: 'principal', label: '', type: 'boolean' },
            { id: 'addressType', controlName: 'type', label: 'Tipo de Dirección', type: 'list', options: this.typeAddressList }
        ];
    }
    getLists() {
        this.stateService.getList().subscribe(
            (states: State[]) => {
                if (states.length != 0) {
                    // Mapear municipios por estado
                    for (const estado of states) {
                        this.municipalitiesList[estado.name] = estado.municipalities.map((mun) => {
                            return { label: mun['name'].toUpperCase(), value: mun['name'] };
                        });
                    }
                    this.statesList = states.map((state) => ({ label: state.name.toUpperCase(), value: state.name }));
                    this.initFields();
                } else {
                    this.statesList = [];
                    this.municipalitiesList = [];
                    this.initFields();
                    this.messageService.add({
                        life: 5000,
                        key: 'msg',
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No hay estados ni municipios disponibles'
                    });
                }
            },
            () => {
                this.statesList = [];
                this.municipalitiesList = [];
                this.messageService.add({
                    life: 5000,
                    key: 'msg',
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar estados'
                });
            }
        );
        this.countryService.getList().subscribe(
            (countries: Country[]) => {
                if (countries.length != 0) {
                    this.countriesList = countries.map((country) => ({
                        label: country.name,
                        value: country.name
                    }));
                } else {
                    this.countriesList = [];
                    this.messageService.add({
                        life: 5000,
                        key: 'msg',
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No hay paises'
                    });
                }
            },
            () => {
                this.countriesList = [];
                this.messageService.add({
                    life: 5000,
                    key: 'msg',
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar paises'
                });
            }
        );
    }
    isSignal(value: any): boolean {
        return isSignal(value);
    }
    openDialog() {
        this.visibleDialog = true;
        this.changeDetector.detectChanges();
    }
    selectAddress(address) {
        this.address = address;
        //se envía el dato al componente padre
        this.sendAddress.emit(address);
        this.resetSteps();
        this.visibleDialog = false;
    }
    searchAddress() {
        this.filter = {};
        if (!this.form.invalid) {
            this.miscService.startRequest();
            this.nextStep();
            for (const key in this.form.value) {
                if (this.form.controls[key].value != null && this.form.controls[key].value != '') {
                    if (key == 'externalNumber' || key == 'internalNumber') {
                        this.filter[key] = '$eq:' + this.form.value[key];
                    } else {
                        this.filter[key] = '$ilike:' + this.form.value[key];
                    }
                }
            }
        } else {
            this.miscService.endRquest();
            this.messageService.add({ life: 5000, key: 'msg', severity: 'warn', summary: 'Nombre es dato obligatorio para busqueda' });
        }
    }
    loadTable(event: TableLazyLoadEvent) {
        this.page = event.first / event.rows + 1;
        this.limit = event.rows;
        this.addressService.getList(this.limit, this.page, this.sortBy, this.filter).subscribe(
            async (data: any) => {
                if (data['meta']['totalItems'] != 0) {
                    this.listAddresses = data['data'];
                    this.totalRows = data['meta']['totalItems'];
                    this.miscService.endRquest();
                } else {
                    this.listAddresses = [];
                    this.totalRows = 0;
                    this.messageService.add({
                        life: 5000,
                        key: 'msg',
                        severity: 'warn',
                        summary: 'No se encontraron domicilios'
                    });
                    this.miscService.endRquest();
                }
            },
            (error: any) => {
                this.listAddresses = [];
                this.totalRows = 0;
                this.miscService.endRquest();
                this.messageService.add({
                    life: 5000,
                    key: 'msg',
                    severity: 'error',
                    summary: 'Error al buscar el domicilio',
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
    addAddress() {
        this.nextStep();
    }
    deleteAddress() {
        //se emite valor nulo al padre para que también lo elimine de allá
        this.address = null;
        this.sendAddress.emit(this.address);
    }
    saveForm() {
        this.miscService.startRequest();
        if (this.form.invalid) {
            this.messageService.add({ life: 5000, key: 'msg', severity: 'error', summary: 'Formulario inválido' });
            this.miscService.endRquest();
            return;
        }
        this.form.value.internalNumber = parseInt(this.form.value.internalNumber);
        this.form.value.externalNumber = parseInt(this.form.value.externalNumber);
        this.addressService.create(this.form.value).subscribe(
            (data: any) => {
                this.address = data['object'];
                this.sendAddress.emit(this.address);
                this.resetSteps();
                this.visibleDialog = false;
                this.miscService.endRquest();
                this.messageService.add({ severity: 'success', key: 'msg', summary: 'Operación exitosa', life: 3000 });
            },
            (error: any) => {
                this.miscService.endRquest(); //fin del proceso por error
                this.messageService.add({ life: 5000, key: 'msg', severity: 'error', summary: 'Error al guardar registro de sucursal', detail: error.error.message });
            }
        );
    }
    getDialogHeader(): string {
        switch (this.currentStep) {
            case 1:
                return 'Nuevo Domicilio';
            case 2:
                return 'Seleccionar Dirección';
            case 3:
                return 'Confirmar Ubicación';
            default:
                return 'Domicilio';
        }
    }
    getNextButtonLabel(): string {
        switch (this.currentStep) {
            case 1:
                return 'Buscar';
            case 2:
                return 'Agregar';
            case 3:
                return 'Guardar';
            default:
                return 'Siguiente';
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
        this.visibleAddForm = this.currentStep === 1;
        this.visibleList = this.currentStep === 2;
        this.visibleConfirmation = this.currentStep === 3;
    }
}
