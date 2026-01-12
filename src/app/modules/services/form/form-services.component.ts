import { Address } from '@/api/address';
import { People } from '@/api/people';
import { AddressesComponent } from '@/components/addresses/addresses.component';
import { ElementComponent } from '@/components/element/element.component';
import { PeopleComponent } from '@/components/people/people.component';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
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
import { Observable, Subscription } from 'rxjs';

@Component({
    selector: 'app-form-services',
    templateUrl: './form-services.component.html',
    imports: [CommonModule, ButtonModule, InputTextModule, ToastModule, ReactiveFormsModule, FormsModule, Fluid, DatePicker, TableModule, MessageModule, CardModule, ElementComponent, AddressesComponent, PeopleComponent, SelectModule],
    standalone: true
})
export class FormServicesComponent implements OnInit, OnChanges {
    form: FormGroup;
    @Output()
    formEmitted = new EventEmitter<FormGroup>();
    @Input()
    list: string[] = [];
    @Input()
    data: Observable<any>;
    newAddress: null | Address;
    private subscription: Subscription;
    arrestTypeList = [
        { label: 'Infraganti', value: 'infraganti' },
        { label: 'Persecución', value: 'persecucion' },
        { label: 'Se encontraron objetos', value: 'se encontraron objetos' },
        { label: 'Indicios', value: 'indicios' },
        { label: 'Por señalamiento inmediato de fragrancia', value: 'por señalamiento inmediato de fragrancia' },
        { label: 'Otro', value: 'otro' }
    ];
    constructor(
        private formBuilder: FormBuilder,
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
                        address: cleanData.address.id,
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
            const arr = this.getOffenderArray();
            arr.clear();
            data.offenders.forEach((item) => {
                arr.push(this.addOffender());
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
        const formOptions: AbstractControlOptions = { validators: this.duplicatePeople() };
        this.form = this.formBuilder.group(
            {
                externalFolio: [null, [Validators.maxLength(50)]],
                iphFolio: [null, [Validators.maxLength(50)]],
                description: [null, Validators.required],
                captureDate: [null, [Validators.required]],
                serviceDate: [null, [Validators.required]],
                dateReception: [null, [Validators.required]],
                arrivalDate: [null, [Validators.required]],
                endDate: [null, [Validators.required]],
                arrestDate: [null, [Validators.required]],
                submissionDate: [null, [Validators.required]],
                elements: this.formBuilder.array([], Validators.required),
                affected: this.formBuilder.array([], Validators.required),
                address: [null, Validators.required],
                offenders: this.formBuilder.array([], Validators.required)
            },
            formOptions
        );
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
                        const peopleId = item.people;
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
        return this.formBuilder.group({
            id:[null],
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
        } else {
            this.form.get('address').setValue(null);
            this.newAddress = null;
        }
    }
    getAffectedArray(): FormArray {
        return this.form.get('affected') as FormArray;
    }
    addAffected() {
        return this.formBuilder.group({
            id: [null],
            idPeople: [null, Validators.required]
        });
    }
    getOffenderArray(): FormArray {
        return this.form.get('offenders') as FormArray;
    }
    addOffender() {
        return this.formBuilder.group({
            id: [ null],
            idPeople: [null, [Validators.required]],
            arrestReason: [null, [Validators.required]],
            arrestType: [null, [Validators.required]]
        });
    }
    removeRow(array: FormArray, index: number) {
        array.removeAt(index);
    }
    addRow(array: any, newRow: any) {
        array.push(newRow);
    }
    onSubmit() {
        if (this.form.invalid) {
            this.messageService.add({
                key: 'msg',
                severity: 'error',
                detail: 'Formulario inválido',
                life: 3000
            });
            return;
        }
        if (this.data!=undefined) {
            let fields:[string,string,string] = ['affected', 'offenders','elements'];
            let properties = this.form.value;
            fields.forEach((field) => {
                properties[field].forEach((anidateField) => {
                    //si viene el id nulo, indica que es nuevo el registro
                    if(anidateField.id===null || anidateField.id===""){
                        delete anidateField.id;
                    }
                });
            });
            this.formEmitted.emit(properties);
        } else {
            this.formEmitted.emit(this.form.value);
        }
        //eliminar people_data ya que solo es para la info del componente hijo
    }
    onCancel(event) {
        event.preventDefault();
        this.router.navigate(['/services']);
    }
}
