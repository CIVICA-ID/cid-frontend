import { Address } from '@/api/address';
import { AddressesComponent } from '@/components/addresses/addresses.component';
import { ElementComponent } from '@/components/element/element.component';
import { PeopleComponent } from '@/components/people/people.component';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, EventEmitter, inject, Injector, Input, OnChanges, OnInit, Output, runInInjectionContext, Signal, SimpleChanges } from '@angular/core';
import { AbstractControl, AbstractControlOptions, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { Fluid } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { Observable, of, startWith, Subscription } from 'rxjs';
import { VehiclesComponent } from '@/components/vehicles/vehicles.component';
import { Vehicle } from '@/api/vehicle';
import { AdministrativeFaultsCategory } from '@/api/administrative-faults-category';
import { AdministrativeFaultsCategoryService } from '@/services/administrative-faults-category.service';
import { CatalogList } from '@/api/catalog-list';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Offender } from '@/api/offender';
import { AdministrativeFaultsService } from '@/services/administrative-faults.service';
import { AdministrativeFaults } from '@/api/administrative-faults';

interface OffenderFormGroup extends FormGroup {
    dynamicOptions: Signal<any[]>;
    isLoading: Signal<boolean>;
    isDisabled: Signal<boolean>;
}
@Component({
    selector: 'app-form-services',
    templateUrl: './form-services.component.html',
    imports: [
        CommonModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        ReactiveFormsModule,
        FormsModule,
        Fluid,
        DatePicker,
        TableModule,
        MessageModule,
        CardModule,
        ElementComponent,
        AddressesComponent,
        PeopleComponent,
        SelectModule,
        VehiclesComponent
    ],
    standalone: true
})
export class FormServicesComponent implements OnInit, OnChanges {
    @Output()
    formEmitted = new EventEmitter<FormGroup>();
    @Input()
    list: string[] = [];
    @Input()
    data: Observable<any>;
    newAddress: null | Address;
    private subscription: Subscription;
    private administrativeFaultsCategoryService: AdministrativeFaultsCategoryService = inject(AdministrativeFaultsCategoryService);
    private administrativeFaultsService: AdministrativeFaultsService = inject(AdministrativeFaultsService);
    private readonly fb = inject(FormBuilder);
    readonly form: FormGroup = this.fb.group(
        {
            externalFolio: [null, [Validators.maxLength(49)]],
            iphFolio: [null, [Validators.maxLength(49)]],
            description: [null, Validators.required],
            captureDate: [null, [Validators.required]],
            serviceDate: [null, [Validators.required]],
            dateReception: [null, [Validators.required]],
            arrivalDate: [null, [Validators.required]],
            endDate: [null, [Validators.required]],
            arrestDate: [null, [Validators.required]],
            submissionDate: [null, [Validators.required]],
            elements: this.fb.array([], Validators.required),
            affected: this.fb.array([], Validators.required),
            address: [null, Validators.required],
            offenders: this.fb.array([], Validators.required),
            involvedVehicle: this.fb.group({
                id: [null],
                idVehicle: [null],
                theftReport: [null],
                deposit: [null]
            }),
            id: [null]
        },
        {
            validators: this.duplicatePeople()
        } as AbstractControlOptions
    );
    private readonly injector = inject(Injector);
    arrestTypeList = [
        { label: 'INFRAGANTI', value: 'infraganti' },
        { label: 'PERSECUCION O SE ENCONTRARON OBJETOS O INDICIOS', value: 'persecucion o se encontraron objetos o indicios' },
        { label: 'POR SEÑALAMIENTO INMEDIATO DE FLAGRANCIA', value: 'por señalamiento inmediato de flagrancia' },
        { label: 'OTRO', value: 'otro' }
    ];
    listAdministrativeFaultsCategory: CatalogList[] = [];
    constructor(
        private router: Router,
        private messageService: MessageService
    ) {}
    ngOnChanges(changes: SimpleChanges) {
        if (changes['data'] && this.data) {
            this.loadCatalogs();
        }
    }
    loadCatalogs() {
        if (this.subscription) this.subscription.unsubscribe();
        this.subscription = this.data.subscribe({
            next: (data) => {
                if (data) {
                    const cleanData = this.convertStringsToDates(data);
                    this.syncFormArrays(cleanData);
                    this.form.patchValue({
                        ...cleanData,
                        address: cleanData.address.id
                    });
                    this.newAddress = cleanData.address;
                }
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', key: 'msg', summary: 'Hubo un error al recibir la información', life: 3000 });
            }
        });
    }
    private syncFormArrays(data: any) {
        if (data.elements) {
            const array = this.getElementArray();
            array.clear();
            data.elements.forEach(() => {
                array.push(this.addElement());
            });
        }
        if (data.affected) {
            const arr = this.getAffectedArray();
            arr.clear();
            data.affected.forEach((item) => {
                arr.push(this.addAffected());
            });
        }
        if (data.offenders) {
            const offendersArray = this.getOffenderArray();
            // arr.clear();
            //
            // data.offenders.forEach((item) => {
            //     arr.push(this.addOffender());
            // });
            // console.log(data);
            // console.log('this.listAdministrativeFaultsCategory', this.listAdministrativeFaultsCategory);
            // // this.administrativeFaultsService.getCategorysById(data.)
            // for(const item of this.form.get("offenders")){
            //     console.log(item);
            //     this.administrativeFaultsService.getCategorysById(data.offenders[i].id_administrative_fault).subscribe({
            //         next: (data) => {
            //             // this.form.get("offenders")[i].get("id_administrative_fault_category").setValue(data)
            //         }
            //     });
            // }
            data.offenders.forEach((offenderData: any) => {
                const newGroup = this.addOffender();
                if (offenderData.id_administrative_fault && !offenderData.id_administrative_fault_category) {
                    this.administrativeFaultsService.getById(offenderData.id_administrative_fault).subscribe((category:AdministrativeFaults) => {
                        newGroup.patchValue({
                            ...offenderData,
                            id_administrative_fault_category: category.id_category
                        });
                        offendersArray.push(newGroup);
                    });
                } else {
                    newGroup.patchValue(offenderData);
                    offendersArray.push(newGroup);
                }
            });
        }
    }
    private convertStringsToDates(obj: any): any {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map((item) => this.convertStringsToDates(item));
        }
        // Si es un objeto, iteramos sus llaves
        const processedObj: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                // Validamos si el string tiene formato de fecha ISO
                if (typeof value === 'string' && this.isIsoDateString(value)) {
                    processedObj[key] = new Date(value);
                } else if (typeof value === 'object') {
                    // Llamada recursiva para objetos anidados o arreglos
                    processedObj[key] = this.convertStringsToDates(value);
                } else {
                    processedObj[key] = value;
                }
            }
        }
        return processedObj;
    }
    // Helper para detectar formato ISO (2026-01-23T18...)
    private isIsoDateString(value: string): boolean {
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
        return isoRegex.test(value);
    }
    ngOnInit() {
        this.administrativeFaultsCategoryService.getList().subscribe({
            next: (data: any) => {
                if (data && data.length > 0) {
                    this.listAdministrativeFaultsCategory = data.map((element) => ({
                        label: element.name.toUpperCase(),
                        value: element.id
                    }));
                }
            },
            error: (error) => {
                this.messageService.add({
                    life: 5000,
                    key: 'msg',
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Hubo un error al cargar el listado de categorías de faltas administrativas'
                });
            }
        });
    }
    duplicatePeople(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const formGroup = control as FormGroup;
            const uniqueValues = new Set<string>();
            let hasDuplicate = false;
            const fields = ['affected', 'offenders'];
            fields.forEach((field) => {
                const array = formGroup.get(field);
                if (array && array.value) {
                    array.value.forEach((item: any) => {
                        const peopleId = item.idPeople;
                        if (peopleId) {
                            if (uniqueValues.has(peopleId)) {
                                hasDuplicate = true;
                            } else {
                                uniqueValues.add(peopleId);
                            }
                        }
                    });
                }
            });
            return hasDuplicate ? { duplicatePeople: true } : null;
        };
    }
    getPeople(data: any, index: number, array: FormArray) {
        const group = array.at(index);
        //se añade nuevo valor
        if (data) {
            group.get('idPeople')?.setValue(data.id);
        }
        //se borra el valor de persona desde el front
        else {
            group.get('id')?.setValue(null);
            group.get('idPeople')?.setValue(null);
        }
    }
    getElementArray(): FormArray {
        return this.form.get('elements') as FormArray;
    }
    addElement() {
        return this.fb.group({
            id: [null],
            grade: [null, [Validators.maxLength(100)]],
            firstName: [null, [Validators.required, Validators.maxLength(50)]],
            paternalName: [null, [Validators.maxLength(50), Validators.required]],
            maternalName: [null, [Validators.maxLength(50), Validators.required]],
            unit: [null, [Validators.maxLength(150), Validators.required]]
        });
    }
    getAddress(data: Address) {
        if (data) {
            this.form.get('address').setValue(data.id);
            this.newAddress = data;
        } else {
            this.form.get('address').setValue(null);
            this.newAddress = null;
        }
    }
    getVehicle(data: Vehicle) {
        if (data) {
            this.form.get('involvedVehicle.idVehicle').setValue(data.id);
        } else {
            this.form.get('involvedVehicle.idVehicle').setValue(null);
        }
    }
    getAffectedArray(): FormArray {
        return this.form.get('affected') as FormArray;
    }
    addAffected() {
        return this.fb.group({
            id: [null],
            idPeople: [null, Validators.required]
        });
    }
    getOffenderArray(): FormArray {
        return this.form.get('offenders') as FormArray;
    }
    getOffenderGroup(control: AbstractControl): OffenderFormGroup {
        return control as OffenderFormGroup;
    }
    addOffender(): OffenderFormGroup {
        const group = this.fb.group({
            id: [null],
            idPeople: [null, [Validators.required]],
            id_administrative_fault: [null ],
            id_administrative_fault_category: [null],
            arrestType: [null, [Validators.required]]
        });
        return runInInjectionContext(this.injector, () => {
            const categoryControl = group.get('id_administrative_fault_category')!;
            const faultControl = group.get('id_administrative_fault')!;
            // Encontrará el primer valor
            const categoryValue = toSignal(categoryControl.valueChanges.pipe(startWith(categoryControl.value)), { initialValue: categoryControl.value });
            //como efecto secundario se activará o desactivará si se tiene un valor en categoryValue
            effect(() => {
                const id = categoryValue();
                if (id) {
                    faultControl.enable({ emitEvent: false }); // Habilitamos si hay categoría
                } else {
                    faultControl.disable({ emitEvent: false }); // Deshabilitamos si no la hay
                    faultControl.setValue(null, { emitEvent: false }); // Limpiamos valor
                }
            });
            //se hará de manera sincrónica
            const resource = rxResource({
                request: () => categoryValue(),
                loader: ({ request: id }) => (id ? this.administrativeFaultsService.getCategorysById(id) : of([]))
            });
            const offenderGroup = group as unknown as OffenderFormGroup;
            // Asignamos los Signals a las propiedades del grupo
            offenderGroup.dynamicOptions = computed(() => {
                const data = resource.value();
                return data ? data.map((item: any) => ({ label: item.description, value: item.id })) : [];
            });
            offenderGroup.isLoading = resource.isLoading;
            return offenderGroup;
        });
    }
    removeRow(array: FormArray, index: number) {
        array.removeAt(index);
    }
    addRow(array: any, newRow: any) {
        array.push(newRow);
    }
    onSubmit() {
        console.log(this.form);
        if (this.form.invalid) {
            this.messageService.add({
                key: 'msg',
                severity: 'error',
                detail: 'Formulario inválido',
                life: 3000
            });
            return;
        }
        let fields: [string, string, string] = ['affected', 'offenders', 'elements'];
        let properties = this.form.value;
        fields.forEach((field) => {
            properties[field].forEach((anidateField) => {
                //si viene el id nulo, indica que es nuevo el registro
                if (anidateField.id === null || anidateField.id === '') {
                    delete anidateField.id;
                }
                if (field == 'offenders') {
                    delete anidateField.id_administrative_fault_category;
                }
            });
        });
        console.log('properties', properties);
        //si el elemento es nuevo no tendrá id
        if (properties.id == null) {
            delete properties.id;
            delete properties.involvedVehicle.id;
        }
        this.formEmitted.emit(properties);
    }
    onCancel(event) {
        event.preventDefault();
        this.router.navigate(['/services']);
    }
}
