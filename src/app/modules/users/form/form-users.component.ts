import { CommonModule } from '@angular/common';
import { Component,  EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AbstractControl,
    AbstractControlOptions,  FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { catchError, forkJoin,  of  } from 'rxjs';
import { RoleService } from '@/services/role.service';
import { DatePicker } from 'primeng/datepicker';
import { Password } from 'primeng/password';
import { UserService } from '@/services/user.service';
import { BranchesService } from '@/services/branches.service';
import { ItemName } from '@/api/itemName';

@Component({
    selector: 'app-form-users',
    templateUrl: './form-users.component.html',
    imports: [CommonModule, ButtonModule, InputTextModule, ToastModule, ReactiveFormsModule, FormsModule, Fluid, TableModule, MessageModule, CardModule, SelectModule, Password, DatePicker],
    standalone: true
})
export class FormUsersComponent implements OnInit {
    private formBuilder: FormBuilder = inject(FormBuilder);
    private router: Router = inject(Router);
    private messageService: MessageService = inject(MessageService);
    private formOptions:AbstractControlOptions={validators:this.duplicateItem()};
    form: FormGroup = this.formBuilder.group({
        fullName: [null, Validators.maxLength(255)],
        nickName: [null, [Validators.required, Validators.maxLength(255)]],
        email: [null, Validators.maxLength(255)],
        emailStatus: ['confirmed', Validators.maxLength(255)],
        password: [null, [Validators.required, Validators.maxLength(255)]],
        branches: this.formBuilder.array([], Validators.required)
    },this.formOptions);
    formFields = [
        {
            id: 'fullName',
            controlName: 'fullName',
            label: 'Nombre Completo',
            maxLength: 255,
            type: 'text'
        },
        {
            id: 'nickName',
            controlName: 'nickName',
            label: 'Nombre de Usuario',
            maxLength: 255,
            type: 'text'
        },
        {
            id: 'password',
            controlName: 'password',
            label: 'Contraseña',
            type: 'password',
            maxLength: 255
        },
        {
            id: 'email',
            controlName: 'email',
            label: 'Correo Electrónico',
            type: 'text',
            maxLength: 255
        },
        {
            id: 'emailStatus',
            controlName: 'emailStatus',
            label: 'Estado del Correo',
            type: 'list',
            options: [
                { label: 'Confirmado', value: 'confirmed' },
                { label: 'Pendiente', value: 'unconfirmed' }
            ]
        }
    ];

    @Output()
    formEmitted = new EventEmitter<FormGroup>();
    listBranches: ItemName[];
    listRoles: ItemName[] ;
    private userServices: UserService = inject(UserService);
    private branchServices: BranchesService = inject(BranchesService);
    private roleServices: RoleService = inject(RoleService);
    _id: string | undefined;
    @Input() set id(value: string | undefined) {
        if (value) {
            this._id = value;
            this.userServices.getById(this.id).subscribe({
                next: (data) => {
                    if (data) {
                        if(data["branches"].length>0) this.syncFormArrays(data);
                        this.form.patchValue({
                            ...data,
                            password:null,
                        });
                    } else {
                        this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo encontrar el usuario', life: 3000 });
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
    constructor() {}
    ngOnInit() {
        this.loadCatalogs();
    }
    loadCatalogs() {
        const requests = {
            branches: this.branchServices.getListSimple().pipe(catchError((error) => this.handleError('Error al cargar el listado de sucursales', error))),
            roles: this.roleServices.getListSimple().pipe(catchError((error) => this.handleError('Error al cargar el listado de roles', error)))
        };

        forkJoin(requests).subscribe({
            next: (res) => {
                this.listBranches = res.branches;
                this.listRoles = res.roles;
                if (this.listBranches.length === 0) this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se encontraron sucursales' });
                if (this.listRoles.length === 0) this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se encontraron roles' });
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error fatal', detail: err.message });
            }
        });
    }
    handleError(summary: string, error: any) {
        this.messageService.add({
            severity: 'error',
            summary,
            detail: error.message,
            life: 5000
        });
        return of(null); // Retorna null para que forkJoin no se detenga
    }
    private syncFormArrays(data: any) {
        if (data.branches) {
            const array = this.getBranchArray();
            array.clear();
            data.branches.forEach(() => {
                array.push(this.addBranch());
            });
        }
    }
    getBranchArray(): FormArray {
        return this.form.get('branches') as FormArray;
    }
    duplicateItem(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const formGroup = control as FormGroup;
            const uniqueValues = new Set<string>();
            let hasDuplicate = false;
            const fields = ['branches'];
            fields.forEach((field) => {
                const array = formGroup.get(field);
                if (array && array.value) {
                    array.value.forEach((item: any) => {
                        const itemId = item.branchId;
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
    addBranch() {
        return this.formBuilder.group({
            id: [null],
            branchId: [null, [Validators.required]],
            roleId: [null, [Validators.required]]
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
        let fields: [string] = ['branches'];
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
        this.router.navigate(['/users']);
    }
}
