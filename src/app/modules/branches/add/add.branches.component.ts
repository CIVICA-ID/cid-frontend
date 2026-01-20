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
import { BranchesService } from '@/services/branches.service';
import { FormBranchesComponent } from '@/modules/branches/form/form-branches.component';

@Component({
    templateUrl: './add.branches.component.html',
    imports: [
        CommonModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        ReactiveFormsModule,
        FormBranchesComponent
    ],
    providers: [MessageService],
    standalone: true
})
export class AddBranchesComponent {
    data: Observable<any>;
    constructor(
        private branchesService: BranchesService,
        private messageService: MessageService,
        private router: Router,
        private miscService: MiscService
    ) {}
    onFormEmitted(event) {
        this.miscService.startRequest();
        this.branchesService.create(event).subscribe(
            () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail:"Sucursal creada correctamente",
                    life: 3000
                });
                setTimeout(() => {
                    this.router.navigate(['/branches']);
                    this.miscService.endRquest();
                }, 1000);
            },
            (error) => {
                this.miscService.endRquest();
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    detail: 'Error al guardar la sucursal, error: ' + error.error.message,
                    life: 3000
                });
            }
        );
    }
}
