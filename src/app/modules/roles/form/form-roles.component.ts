import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, AbstractControlOptions, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Fluid } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { Observable, Subscription } from 'rxjs';
import { ModulesServices } from '@/services/modules.service';
import { Checkbox } from 'primeng/checkbox';
import { RoleService } from '@/services/role.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-form-roles',
    templateUrl: './form-roles.component.html',
    imports: [CommonModule, ButtonModule, InputTextModule, ToastModule, ReactiveFormsModule, FormsModule, Fluid, TableModule, MessageModule, CardModule, SelectModule, Checkbox],
    standalone: true
})
export class FormRolesComponent implements OnInit {
    private formBuilder: FormBuilder = inject(FormBuilder);
    private formOptions: AbstractControlOptions = { validators: [this.duplicateItem()] };
    private router: Router = inject(Router);
    private messageService: MessageService = inject(MessageService);
    form: FormGroup = this.formBuilder.group(
        {
            name: [null, Validators.required],
            rights: this.formBuilder.array([], Validators.required)
        },
        this.formOptions
    );
    @Output()
    formEmitted = new EventEmitter<FormGroup>();
    @Input()
    listModules: {
        id: string;
        name: string;
    }[];
    @Input()
    private modulesService: ModulesServices = inject(ModulesServices);
    private rolesService: RoleService = inject(RoleService);
    _id: string | undefined;
    @Input() set id(value: string | undefined) {
        if (value) {
            this._id = value;
            this.rolesService.getById(this.id).subscribe({
                next: (data) => {
                    if (data) {
                        this.syncFormArrays(data);
                        // this.form.patchValue({
                        //     ...data
                        // });
                        this.form.patchValue(data);
                    } else {
                        this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo encontrar el rol', life: 3000 });
                    }
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', key: 'msg', summary: 'Hubo un error al recibir la información', life: 3000 });
                }
            });
        }
    }
    get id(): string | undefined {
        return this._id;
    }
    masterCheck=new FormControl(false);
    constructor() {}
    private syncFormArrays(data: any) {
        if (data.rights) {
            const array = this.getRightArray();
            array.clear();
            data.rights.forEach(() => {
                array.push(this.addRight());
            });
        }
    }
    getRightArray(): FormArray {
        return this.form.get('rights') as FormArray;
    }
    ngOnInit() {
        this.getRightArray().valueChanges.subscribe(values => {
            // Basta con que UN elemento sea false para que el maestro sea false
            const allSelected = values.every((r: any) =>
                r.add && r.update && r.delete && r.list && r.display && r.disable
            );
            this.masterCheck.patchValue(allSelected, { emitEvent: false });
        });
        this.modulesService.getListSimple().subscribe({
            next: (data) => {
                if (data) {
                    this.listModules = data;
                }
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', key: 'msg', summary: 'Hubo un error al recibir la lista de módulos', life: 3000 });
            }
        });
    }
    duplicateItem(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const formGroup = control as FormGroup;
            const uniqueValues = new Set<string>();
            let hasDuplicate = false;
            const fields = ['rights'];
            fields.forEach((field) => {
                const array = formGroup.get(field);
                if (array && array.value) {
                    array.value.forEach((item: any) => {
                        const itemId = item.module;
                        if (itemId) {
                            if (uniqueValues.has(itemId)) {
                                hasDuplicate = true;
                            } else {
                                uniqueValues.add(itemId);
                            }
                        }
                    });
                }
            });
            return hasDuplicate ? { duplicateItem: true } : null;
        };
    }
    addRight() {
        return this.formBuilder.group({
            id: [null],
            moduleId: [null, [Validators.required]],
            add: [false, [Validators.required]],
            update: [false, [Validators.required]],
            delete: [false, [Validators.required]],
            list: [false, [Validators.required]],
            disable: [false, [Validators.required]],
            display: [false, [Validators.required]]
        });
    }
    removeRow(array: FormArray, index: number) {
        array.removeAt(index);
    }
    addRow(array: any, newRow: any) {
        array.push(newRow);
    }
    toggleAll(event) {
        const rigthsArray = this.getRightArray();
        if (event.checked)
            rigthsArray.controls.forEach((control: AbstractControl) => {
                control.patchValue({
                    add: true,
                    update: true,
                    delete: true,
                    list: true,
                    disable: true,
                    display: true
                });
            });
        else
            rigthsArray.controls.forEach((control: AbstractControl) => {
                control.patchValue({
                    add: false,
                    update: false,
                    delete: false,
                    list: false,
                    disable: false,
                    display: false
                });
            });
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
        let fields: [string] = ['rights'];
        let properties = this.form.value;
        fields.forEach((field) => {
            properties[field].forEach((anidateField) => {
                //si viene el id nulo, indica que es nuevo el registro
                if (anidateField.id === null || anidateField.id === '') {
                    delete anidateField.id;
                }
            });
        });
        this.formEmitted.emit(properties);
    }
    onCancel(event) {
        event.preventDefault();
        this.router.navigate(['/roles']);
    }
}
