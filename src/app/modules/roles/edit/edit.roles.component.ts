import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { Observable } from 'rxjs';
// import { MiscService } from '@/roles/misc.service';
import { FormRolesComponent } from '@/modules/roles/form/form-roles.component';
import { RoleService } from '@/services/role.service';

@Component({
    templateUrl: './edit.roles.component.html',
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
export class EditRolesComponent implements OnInit{
    data: Observable<any>;
    id:string='';
    constructor(
        private rolesService: RoleService,
        private messageService: MessageService,
        private router: Router,
        private route:ActivatedRoute
    ) {}
    onFormEmitted(event) {
        // this.miscService.startRequest();
        this.rolesService.update(this.id,event).subscribe(
            () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail:"Servicio actualizado correctamente",
                    life: 3000
                });
                setTimeout(() => {
                    this.router.navigate(['/roles']);
                    // this.miscService.endRquest();
                }, 1000);
            },
            (error) => {
                // this.miscService.endRquest();
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    detail: 'Error al guardar el servicio, error: ' + error.error.message,
                    life: 3000
                });
            }
        );
    }
    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
    }
}
