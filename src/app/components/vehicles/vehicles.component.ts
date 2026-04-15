import { ChangeDetectorRef, Component, computed, effect, EventEmitter, inject, Input, isSignal, OnInit, Output, Signal } from '@angular/core';
import { AbstractControlOptions, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MiscService } from '@/services/misc.service';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { toSignal } from '@angular/core/rxjs-interop';
import { Vehicle } from '@/api/vehicle';
import { VehicleBrandsService } from '@/services/vehicle-brands.service';
import { VehicleSubBrandsService } from '@/services/vehicle-subbrands.service';
import { forkJoin } from 'rxjs';
import { VehiclesService } from '@/services/vehicles.service';
import { VehicleColorsService } from '@/services/vehicle-colors.service';
import { StateService } from '@/services/states.service';
import { CatalogList } from '@/api/catalog-list';

@Component({
    selector: 'app-vehicles',
    templateUrl: './vehicles.component.html',
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, DialogModule, ReactiveFormsModule, InputNumberModule, TableModule, SelectModule, DatePickerModule, InputNumberModule],
    standalone: true
})
export class VehiclesComponent implements OnInit {
    vehicle: any;
    visibleDialog: boolean = false;
    visibleAddForm: boolean = true;
    visibleList: boolean = false;
    visibleConfirmation: boolean = false;
    private formBuilder = inject(FormBuilder);
    formOptions: AbstractControlOptions = { validators: Validators.nullValidator };
    form: FormGroup | any = this.formBuilder.group(
        {
            idBrand: [null, [Validators.required, Validators.maxLength(120)]],
            otherBrand: [null, [Validators.maxLength(120)]],
            idSubBrand: [null, [Validators.maxLength(120)]],
            otherSubBrand: [null, [Validators.maxLength(120)]],
            idState: [null],
            model: [null, [Validators.min(1000)]],
            idColor: [null, [Validators.maxLength(50), Validators.required]],
            tonality: [null, [Validators.maxLength(50)]],
            plates: [null, [Validators.maxLength(20)]],
            vin: [null, [Validators.maxLength(17)]]
        },
        this.formOptions
    );
    private vehicleService: VehiclesService = inject(VehiclesService);
    //se añade esto para que al seleccionar un address completo se autocomplete los valores en el form
    @Input() set newVehicle(value: any) {
        if (value) {
            this.vehicleService.getById(value).subscribe(
                (data: Vehicle) => {
                    if (!data['message']) {
                        this.vehicle = data;
                    } else {
                        this.messageService.add({
                            life: 5000,
                            key: 'msg',
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo encontrar el vehícuo'
                        });
                    }
                },
                (error) => {
                    this.messageService.add({
                        life: 5000,
                        key: 'msg',
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al obtener el vehículo, error: ' + error.message
                    });
                }
            );
        } else {
            this.form.reset();
        }
    }
    @Output()
    sendVehicle = new EventEmitter<Vehicle>();
    currentStep: number = 1;
    steps = 3;
    page: number = 1;
    sortBy: [[string, string]] = [['createdAt', 'DESC']];
    totalRows: number = 0;
    limit: number = 10;
    subBrandsList: CatalogList[] = [];
    brandsList: CatalogList[] = [];
    vehiclesColorsList: CatalogList[] = [];
    statesList: CatalogList[] = [];
    fields = [];
    brandValue = toSignal<CatalogList | null>(this.form.get('idBrand')!.valueChanges, {
        initialValue: this.form.get('idBrand')?.value
    });
    subBrandValue = toSignal<CatalogList | null>(this.form.get('idSubBrand')!.valueChanges, {
        initialValue: this.form.get('idSubBrand')?.value
    });
    manageOtherSubBrandEffect = effect(() => {
        const subBrand = this.subBrandValue();
        const exists = this.fields.some((f) => f.id === 'otherSubBrand');

        if (subBrand?.label === 'OTRO' && !exists) {
            const index = this.fields.findIndex((f) => f.controlName === 'idSubBrand');
            this.fields.splice(index + 1, 0, {
                id: 'otherSubBrand',
                controlName: 'otherSubBrand',
                label: 'Especifique Submarca',
                type: 'text'
            });
        } else if (subBrand?.label !== 'otro' && exists) {
            this.fields = this.fields.filter((f) => f.id !== 'otherSubBrand');
        }
    });
    manageOtherFieldBrandEffect = effect(() => {
        const idBrand = this.brandValue();
        const control = this.form.get('otherBrand');
        // Verificamos si el campo ya está en la lista visual
        const fieldExists = this.fields.some((f) => f.id === 'otherBrand');
        if (idBrand?.label == 'OTRO') {
            if (!fieldExists) {
                this.fields.splice(1, 0, {
                    id: 'otherBrand',
                    controlName: 'otherBrand',
                    label: 'Especifique Marca',
                    maxLength: 120,
                    type: 'text'
                });
            }
            control?.setValidators([Validators.required]);
        } else {
            if (fieldExists) {
                this.fields = this.fields.filter((field) => field.id !== 'otherBrand');
            }
            control?.clearValidators();
            control?.setValue(null);
        }
        control?.updateValueAndValidity({ emitEvent: false });
    });
    filter = {};
    vechileSubBrandSignal: Signal<any> = computed(() => {
        const brandId: CatalogList = this.brandValue();
        if (brandId && this.subBrandsList[brandId?.label]) {
            return this.subBrandsList[brandId.label];
        }
        return [];
    });
    //controlar si el control está habilitado o no dependiendo del valor de brands
    manageVechileSubBrandStatus = effect(() => {
        const list = this.vechileSubBrandSignal();
        const control = this.form.get('idSubBrand');
        if (list && list.length > 0) {
            control?.enable({ emitEvent: false });
        } else {
            control?.disable({ emitEvent: false });
            control?.setValue(null, { emitEvent: false });
        }
    });
    listVehicles: Vehicle[];
    private messageService: MessageService = inject(MessageService);
    private miscService: MiscService = inject(MiscService);
    private changeDetector: ChangeDetectorRef = inject(ChangeDetectorRef);
    private vehiclesService: VehiclesService = inject(VehiclesService);
    private vehicleBrandsService: VehicleBrandsService = inject(VehicleBrandsService);
    private vehicleSubBrandsService: VehicleSubBrandsService = inject(VehicleSubBrandsService);
    private vehicleColorsService: VehicleColorsService = inject(VehicleColorsService);
    private statesService: StateService = inject(StateService);
    ngOnInit(): void {
        this.getLists();
    }
    initFields() {
        this.fields = [
            {
                id: 'idBrand',
                controlName: 'idBrand',
                label: 'Marca',
                maxLength: 120,
                type: 'list',
                options: this.brandsList
            },
            {
                id: 'idSubBrand',
                controlName: 'idSubBrand',
                label: 'Submarca',
                maxLength: 120,
                type: 'list',
                options: this.vechileSubBrandSignal
            },
            {
                id: 'idState',
                controlName: 'idState',
                label: 'Estado de Registro',
                type: 'list',
                options: this.statesList
            },
            {
                id: 'model',
                controlName: 'model',
                label: 'Modelo (Año)',
                type: 'number'
            },
            {
                id: 'idColor',
                controlName: 'idColor',
                label: 'Color',
                maxLength: 50,
                type: 'list',
                options: this.vehiclesColorsList
            },
            {
                id: 'tonality',
                controlName: 'tonality',
                label: 'Tonalidad',
                maxLength: 50,
                type: 'text'
            },
            {
                id: 'plates',
                controlName: 'plates',
                label: 'Placas',
                maxLength: 20,
                type: 'text'
            },
            {
                id: 'vin',
                controlName: 'vin',
                label: 'Número de Serie (VIN)',
                maxLength: 17,
                type: 'text'
            }
        ];
    }
    getLists() {
        forkJoin({
            brands: this.vehicleBrandsService.getList(),
            colors: this.vehicleColorsService.getList(),
            states: this.statesService.getList()
        }).subscribe({
            next: ({ brands, colors, states }) => {
                if (brands && brands.length > 0) {
                    for (const brand of brands) {
                        this.subBrandsList[brand.name] = brand.subbrands.map((subBrand) => ({
                            label: subBrand.name.toUpperCase(),
                            value: subBrand.id
                        }));
                    }
                    this.brandsList = brands.map((brand) => ({
                        value: brand.id,
                        label: brand.name
                    }));
                } else {
                    this.brandsList = [];
                    this.showError('No hay marcas de vehículos disponibles');
                }
                if (colors && colors.length > 0) {
                    this.vehiclesColorsList = colors.map((idColor) => ({
                        label: idColor.name.toUpperCase(),
                        value: idColor.id,
                        hex: idColor.hex || '#CCCCCC'
                    }));
                } else {
                    this.vehiclesColorsList = [];
                    this.showError('No hay colores disponibles');
                }
                if (states && states.length > 0) {
                    this.statesList = states.map((element) => ({
                        label: element.name.toUpperCase(),
                        value: element.id
                    }));
                    this.form.get('idState').setValue({
                        label: 'JALISCO',
                        value: '981189ac-8ced-4d25-9135-0858a13fb639'
                    });
                }
                //cargar el elemento seleccionado, sólo si existe un vehículo
                if (this.vehicle != null) {
                    const foundSubBrand = Object.values(this.subBrandsList)
                        .flat()
                        .find((item) => item.value === this.vehicle.idSubBrand);
                    this.form.patchValue({
                        ...this.vehicle,
                        idBrand: this.findIdCatalog(this.brandsList, this.vehicle.idBrand),
                        idColor: this.findIdCatalog(this.vehiclesColorsList, this.vehicle.idColor),
                        idSubBrand: foundSubBrand || null,
                        idState: this.findIdCatalog(this.statesList, this.vehicle.idState) || null
                    });
                }
                this.initFields();
            },
            error: (err) => {
                this.brandsList = [];
                this.subBrandsList = [];
                this.vehiclesColorsList = [];
                this.showError('Error general al cargar los catálogos');
            }
        });
    }
    private showError(detail: string) {
        this.messageService.add({
            life: 5000,
            key: 'msg',
            severity: 'error',
            summary: 'Error',
            detail
        });
    }
    isSignal(value: any): boolean {
        return isSignal(value);
    }
    openDialog() {
        this.visibleDialog = true;
        this.changeDetector.detectChanges();
    }
    selectVehicle(vehicle) {
        const foundSubBrand = Object.values(this.subBrandsList)
            .flat()
            .find((item) => item.value === vehicle.idSubBrand);
        this.form.patchValue( {
            ...vehicle,
            idBrand: this.findIdCatalog(this.brandsList, vehicle.idBrand),
            idColor: this.findIdCatalog(this.vehiclesColorsList, vehicle.idColor),
            idSubBrand: foundSubBrand,
            idState: this.findIdCatalog(this.statesList, vehicle.idState)
        });
        //se envía el dato al componente padre
        this.sendVehicle.emit(vehicle);
        this.resetSteps();
        this.visibleDialog = false;
    }
    searchVehicle() {
        console.log({ forkJoin:this.form });
        this.filter = {};
        if (!this.form.invalid) {
            this.miscService.startRequest();
            this.nextStep();
            for (const key in this.form.value) {
                if (this.form.controls[key].value != null && this.form.controls[key].value != '') {
                    const controlValue = this.form.get(key)?.value;
                    if (typeof controlValue === 'object') {
                        this.filter[key] = '$eq:' + this.form.value[key].value;
                    } else {
                        this.filter[key] = '$ilike:' + this.form.value[key];
                    }
                }
            }
        } else {
            this.miscService.endRquest();
            this.messageService.add({ life: 5000, key: 'msg', severity: 'warn', summary: 'Llenar campos obligatorios para la busqueda' });
        }
    }
    loadTable(event: TableLazyLoadEvent) {
        this.page = event.first / event.rows + 1;
        this.limit = event.rows;
        this.vehiclesService.getList(this.limit, this.page, this.sortBy, this.filter).subscribe(
            async (data: any) => {
                if (data['meta']['totalItems'] != 0) {
                    this.listVehicles = data['data'];
                    this.totalRows = data['meta']['totalItems'];
                    this.miscService.endRquest();
                } else {
                    this.listVehicles = [];
                    this.totalRows = 0;
                    this.messageService.add({
                        life: 5000,
                        key: 'msg',
                        severity: 'warn',
                        summary: 'No se encontraron vehículos'
                    });
                    this.miscService.endRquest();
                }
            },
            (error: any) => {
                this.listVehicles = [];
                this.totalRows = 0;
                this.miscService.endRquest();
                this.messageService.add({
                    life: 5000,
                    key: 'msg',
                    severity: 'error',
                    summary: 'Error al buscar el vehículo',
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
    addVehicle() {
        this.nextStep();
    }
    deleteVehicle() {
        //se emite valor nulo al padre para que también lo elimine de allá
        this.vehicle = null;
        this.sendVehicle.emit(this.vehicle);
    }
    findIdCatalog(list, id) {
        return list.find((item) => item.value === id);
    }
    saveForm() {
        this.miscService.startRequest();
        if (this.form.invalid) {
            this.messageService.add({ life: 5000, key: 'msg', severity: 'error', summary: 'Formulario inválido' });
            this.miscService.endRquest();
            return;
        }
        const fields = ['idBrand', 'idSubBrand', 'idState', 'idColor'];
        const formValues = { ...this.form.value };
        fields.forEach((field) => {
            if (formValues[field] != null && 'label' in formValues[field]) {
                formValues[field] = formValues[field].value;
            }
        });
        this.vehiclesService.create(formValues).subscribe(
            (data: any) => {
                const foundSubBrand = Object.values(this.subBrandsList)
                    .flat()
                    .find((item) => item.value === data['object'].idSubBrand);
                this.form.patchValue(  {
                    ...data['object'],
                    idBrand: this.findIdCatalog(this.brandsList, data['object'].idBrand),
                    idColor: this.findIdCatalog(this.vehiclesColorsList, data['object'].idColor),
                    idSubBrand: foundSubBrand,
                    idState: this.findIdCatalog(this.statesList, data['object'].idState)
                });
                this.sendVehicle.emit(data["object"]);
                this.resetSteps();
                this.visibleDialog = false;
                this.messageService.add({ severity: 'success', key: 'msg', summary: 'Operación exitosa', life: 3000 });
                this.miscService.endRquest();
            },
            (error: any) => {
                this.miscService.endRquest();
                this.messageService.add({ life: 5000, key: 'msg', severity: 'error', summary: 'Error al guardar registro de sucursal', detail: error.error.message });
            }
        );
    }
    getDialogHeader(): string {
        switch (this.currentStep) {
            case 1:
                return 'Nuevo Vehículo';
            case 2:
                return 'Seleccionar Vehículo';
            case 3:
                return 'Confirmar Vehículo';
            default:
                return 'Vehículo';
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
