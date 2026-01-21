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
import { FormModulesComponent } from '@/modules/modules/form/form-modules.component';

@Component({
    templateUrl: './add.modules.component.html',
    imports: [
        CommonModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        ReactiveFormsModule,
        FormModulesComponent
    ],
    providers: [MessageService],
    standalone: true
})
export class AddModulesComponent {
    data: Observable<any>;
    constructor(
        private modulesService: ModulesServices,
        private messageService: MessageService,
        private router: Router,
        private miscService: MiscService
    ) {}
    onFormEmitted(event) {
        this.miscService.startRequest();
        this.modulesService.create(event).subscribe(
            () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail:"Módulo creado correctamente",
                    life: 3000
                });
                setTimeout(() => {
                    this.router.navigate(['/modules']);
                    this.miscService.endRquest();
                }, 1000);
            },
            (error) => {
                this.miscService.endRquest();
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    detail: 'Error al guardar el módulo, error: ' + error.error.message,
                    life: 3000
                });
            }
        );
    }
}
