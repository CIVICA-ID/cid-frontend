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
import { FormBranchesComponent } from '@/modules/branches/form/form-branches.component';
import { BranchesService } from '@/services/branches.service';

@Component({
    templateUrl: './edit.branches.component.html',
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
export class EditBranchesComponent implements OnInit{
    data: Observable<any>;
    id:string='';
    constructor(
        private branchesService: BranchesService,
        private messageService: MessageService,
        private router: Router,
        private route:ActivatedRoute
    ) {}
    onFormEmitted(event) {
        // this.miscService.startRequest();
        this.branchesService.update(this.id,event).subscribe(
            () => {
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    detail:"Sucursal actualizada correctamente",
                    life: 3000
                });
                setTimeout(() => {
                    this.router.navigate(['/branches']);
                    // this.miscService.endRquest();
                }, 1000);
            },
            (error) => {
                // this.miscService.endRquest();
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    detail: 'Error al guardar la sucursal, error: ' + error.error.message,
                    life: 3000
                });
            }
        );
    }
    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
    }
}
