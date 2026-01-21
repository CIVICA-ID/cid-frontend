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
import { ModulesServices } from '@/services/modules.service';
import { FormModulesComponent } from '@/modules/modules/form/form-modules.component';

@Component({
    templateUrl: './edit.modules.component.html',
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
export class EditModulesComponent implements OnInit{
    data: Observable<any>;
    id:string='';
    constructor(
        private modulesService: ModulesServices,
        private messageService: MessageService,
        private router: Router,
        private route:ActivatedRoute
    ) {}
    onFormEmitted(event) {
        // this.miscService.startRequest();
        this.modulesService.update(this.id,event).subscribe(
            () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail:"Módulo actualizado correctamente",
                    life: 3000
                });
                setTimeout(() => {
                    this.router.navigate(['/modules']);
                    // this.miscService.endRquest();
                }, 1000);
            },
            (error) => {
                // this.miscService.endRquest();
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    detail: 'Error al guardar el módulo, error: ' + error.error.message,
                    life: 3000
                });
            }
        );
    }
    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
    }
}
