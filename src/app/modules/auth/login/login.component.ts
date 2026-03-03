import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { LazyImageWidget } from '@/pages/landing/components/lazyimagewidget';
import { LogoWidget } from '@/pages/landing/components/logowidget';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserBranchsService } from '@/services/user-branchs.service';
import { UserService } from '@/services/user.service';
import { User } from '@/api/user';
import { Branch } from '@/api/branch';
import { Select } from 'primeng/select';
import { AuthService } from '@/services/auth.service';
import { SessionService } from '@/services/session.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [LogoWidget, CommonModule, ReactiveFormsModule, InputTextModule, LazyImageWidget, CheckboxModule, RouterLink, Toast, Select],
    templateUrl: './login.component.html',
    providers: [MessageService]
})
export class LoginComponent {
    loginForm: FormGroup;
    currentYear: number = new Date().getFullYear();
    visibleBranches: boolean = false;
    private messageService: MessageService = inject(MessageService);
    private fb: FormBuilder = inject(FormBuilder);
    private userBranchsService: UserBranchsService = inject(UserBranchsService);
    private userService: UserService = inject(UserService);
    private authService: AuthService = inject(AuthService);
    private sessionService: SessionService = inject(SessionService);
    private router: Router = inject(Router);
    userId: string;
    listBranchs: Branch[] = [];
    constructor() {
        this.loginForm = this.fb.group({
            nickName: [null, Validators.required],
            password: [null, Validators.required],
            branch: [null]
        });
    }

    ngSubmitBranchs(): void {
        if (this.loginForm.invalid) {
            this.messageService.add({ key: 'msg', severity: 'error', summary: 'Faltan campos por llenar', life: 3000 });
            return;
        }
        this.userService.getUser(this.loginForm.get('nickName').value).subscribe({
            next: (data: User) => {
                if (data.id) {
                    this.userId = data.id;
                    this.userBranchsService.getUserBranches(this.userId).subscribe({
                        next: (data: any) => {
                            if (data.statusCode != 400) {
                                this.listBranchs = data.map((branch: any) => {
                                    return {
                                        name: branch.branch.name,
                                        id: branch.branch.id
                                    };
                                });
                                if (this.listBranchs.length === 1) {
                                    const branchControl = this.loginForm.get('branch');
                                    branchControl.setValue(this.listBranchs[0]?.id);
                                    this.login();
                                } else {
                                    if (this.sessionService.getBranch())
                                    {
                                        const branchControl = this.loginForm.get('branch');
                                        branchControl.setValue(this.listBranchs[0]?.id);
                                    }
                                    this.visibleBranches = true;
                                }
                            }
                        },
                        error: (error) => {
                            this.messageService.add({ severity: 'error', key: 'msg', summary: 'Hubo un error al consultar las sucursales del usuario', life: 3000 });
                        }
                    });
                } else {
                    this.messageService.add({ severity: 'error', key: 'msg', summary: 'No existe ese usuario', life: 3000 });
                }
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', key: 'msg', summary: 'Hubo un error al consultar el usuario, error' + error.message, life: 3000 });
            }
        });
    }
    ngSubmitLogin(): void {
        if (this.loginForm.get('branch').value == null) {
            this.messageService.add({ key: 'msg', severity: 'error', summary: 'Falta campo por llenar', life: 3000 });
            return;
        }
        this.login();
    }
    login(): void {
        this.authService.login(this.loginForm.value).subscribe({
            next: (data: any) => {
                if (data.statusCode != 404) {
                    this.messageService.add({ severity: 'success', key: 'msg', summary: 'Inicio de sesión exitoso', life: 3000 });
                    this.sessionService.setToken(data.token);
                    this.sessionService.setBranch(data.branch);
                    this.router.navigate(['/']);
                }
            },
            error: (error) => {
                if (error.error.statusCode == 404) {
                    this.messageService.add({ severity: 'error', key: 'msg', summary: 'Credenciales inválidas', life: 3000 });
                } else {
                    this.messageService.add({ severity: 'error', key: 'msg', summary: 'Hubo un error al ingresar la sesión, error' + error.message, life: 3000 });
                }
            }
        });
    }
}
