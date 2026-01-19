import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { Observable } from 'rxjs';
import { RoleService } from '@/services/role.service';
import { MiscService } from '@/services/misc.service';
import { FormRolesComponent } from '@/modules/roles/form/form-roles.component';

@Component({
    templateUrl: './add.roles.component.html',
    imports: [
        CommonModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        ReactiveFormsModule,
        FormRolesComponent
    ],
    providers: [MessageService],
    standalone: true
})
export class AddRolesComponent {
    data: Observable<any>;
    constructor(
        private rolesService: RoleService,
        private messageService: MessageService,
        private router: Router,
        private miscService: MiscService
    ) {}
    onFormEmitted(event) {
        this.miscService.startRequest();
        this.rolesService.create(event).subscribe(
            () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail:"Rol creado correctamente",
                    life: 3000
                });
                setTimeout(() => {
                    this.router.navigate(['/roles']);
                    this.miscService.endRquest();
                }, 1000);
            },
            (error) => {
                this.miscService.endRquest();
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    detail: 'Error al guardar el rol, error: ' + error.error.message,
                    life: 3000
                });
            }
        );
    }
}
