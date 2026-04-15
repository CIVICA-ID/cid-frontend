import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output  } from '@angular/core';
import {  FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { BranchesService } from '@/services/branches.service';

@Component({
    selector: 'app-form-branches',
    templateUrl: './form-branches.component.html',
    imports: [CommonModule, ButtonModule, InputTextModule, ToastModule, ReactiveFormsModule, FormsModule, Fluid, TableModule, MessageModule, CardModule, SelectModule],
    standalone: true
})
export class FormBranchesComponent implements OnInit {
    private formBuilder: FormBuilder = inject(FormBuilder);
    private router: Router = inject(Router);
    private messageService: MessageService = inject(MessageService);
    form: FormGroup = this.formBuilder.group({
        name: [null, Validators.required]
    });
    @Output()
    formEmitted = new EventEmitter<FormGroup>();
    @Input()
    listModules: {
        id: string;
        name: string;
    }[];
    private branchesService: BranchesService = inject(BranchesService);
    _id: string | undefined;
    @Input() set id(value: string | undefined) {
        if (value) {
            this._id = value;
            this.branchesService.getById(this.id).subscribe({
                next: (data) => {
                    if (data) {
                        this.form.patchValue(data);
                    } else {
                        this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo encontrar la sucursal', life: 3000 });
                    }
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', key: 'msg', summary: 'Error',detail:"Hubo un error al recibir la información, error: "+error.error.message, life: 3000 });
                }
            });
        }
    }
    get id(): string | undefined {
        return this._id;
    }
    constructor() {}

    ngOnInit() {}
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
        this.formEmitted.emit(this.form.value);
    }
    onCancel(event) {
        event.preventDefault();
        this.router.navigate(['/branches']);
    }
}
