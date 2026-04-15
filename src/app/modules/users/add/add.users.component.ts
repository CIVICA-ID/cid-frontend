import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { Observable } from 'rxjs';
import { MiscService } from '@/services/misc.service';
import { ModulesServices } from '@/services/modules.service';
import { FormUsersComponent } from '@/modules/users/form/form-users.component';
import { UserService } from '@/services/user.service';

@Component({
    templateUrl: './add.users.component.html',
    imports: [
        CommonModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        ReactiveFormsModule,
        FormUsersComponent
    ],
    providers: [MessageService],
    standalone: true
})
export class AddUsersComponent {
    data: Observable<any>;
    constructor(
        private usersService: UserService,
        private messageService: MessageService,
        private router: Router,
        private miscService: MiscService
    ) {}
    onFormEmitted(event) {
        this.miscService.startRequest();
        this.usersService.create(event).subscribe(
            () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail:"Usuario creado correctamente",
                    life: 3000
                });
                setTimeout(() => {
                    this.router.navigate(['/users']);
                    this.miscService.endRquest();
                }, 1000);
            },
            (error) => {
                this.miscService.endRquest();
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    detail: 'Error al guardar el usuario, error: ' + error.error.message,
                    life: 3000
                });
            }
        );
    }
}
