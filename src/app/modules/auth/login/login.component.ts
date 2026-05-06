import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '@/services/auth.service';
import { SessionService } from '@/services/session.service';
import { Auth } from '@/api/auth';
import { AuthLoginResponse, BranchOption } from '@/services/auth-session.model';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, Toast, Password],
    templateUrl: './login.component.html',
    providers: [MessageService]
})
export class LoginComponent {
    loginForm: FormGroup;
    currentYear: number = new Date().getFullYear();
    visibleBranches: boolean = false;
    loginTicket: string | null = null;
    private messageService: MessageService = inject(MessageService);
    private fb: FormBuilder = inject(FormBuilder);
    private authService: AuthService = inject(AuthService);
    private sessionService: SessionService = inject(SessionService);
    private router: Router = inject(Router);
    listBranchs: BranchOption[] = [];
    constructor() {
        this.loginForm = this.fb.group({
            nickName: [null, Validators.required],
            password: [null, Validators.required],
            branch: [null, Validators.required]
        });
    }

    ngSubmitBranchs(): void {
        if (this.loginForm.get('nickName')?.invalid || this.loginForm.get('password')?.invalid) {
            this.loginForm.get('nickName')?.markAsTouched();
            this.loginForm.get('password')?.markAsTouched();
            this.messageService.add({ key: 'msg', severity: 'error', summary: 'Faltan campos por llenar', life: 3000 });
            return;
        }
        this.login();
    }
    ngSubmitLogin(): void {
        if (this.loginForm.get('branch')?.value == null) {
            this.loginForm.get('branch')?.markAsTouched();
            this.messageService.add({ key: 'msg', severity: 'error', summary: 'Falta campo por llenar', life: 3000 });
            return;
        }
        this.login();
    }

    returnToCredentials(): void {
        this.visibleBranches = false;
        this.loginTicket = null;
        this.listBranchs = [];
        this.loginForm.get('branch')?.setValue(null);
        this.loginForm.get('branch')?.markAsUntouched();
    }

    selectBranch(branchId: string): void {
        this.loginForm.get('branch')?.setValue(branchId);
        this.loginForm.get('branch')?.markAsTouched();
    }

    login(): void {
        const isBranchSelection = this.visibleBranches && !!this.loginTicket;
        const payload: Auth = isBranchSelection
            ? {
                  nickName: this.loginForm.get('nickName')?.value,
                  branch: this.loginForm.get('branch')?.value,
                  loginTicket: this.loginTicket ?? undefined
              }
            : {
                  nickName: this.loginForm.get('nickName')?.value,
                  password: this.loginForm.get('password')?.value
              };

        this.authService.login(payload).subscribe({
            next: (data: AuthLoginResponse) => {
                if (data.requiresBranchSelection) {
                    this.loginTicket = data.loginTicket;
                    this.listBranchs = data.branches ?? [];
                    this.visibleBranches = true;
                    this.loginForm.get('branch')?.setValue(null);
                    this.loginForm.get('branch')?.markAsUntouched();
                    this.messageService.add({
                        severity: 'info',
                        key: 'msg',
                        summary: 'Selecciona la sucursal para continuar',
                        life: 3000
                    });
                    return;
                }
                if (data.statusCode !== 404) {
                    this.messageService.add({ severity: 'success', key: 'msg', summary: 'Inicio de sesión exitoso', life: 3000 });
                    this.sessionService.setSession(data);
                    if (data.branch) {
                        this.sessionService.setBranch(data.branch);
                    }
                    this.visibleBranches = false;
                    this.loginTicket = null;
                    this.router.navigate(['/']);
                }
            },
            error: (error) => this.handleLoginError(error)
        });
    }

    private handleLoginError(error: any): void {
        const statusCode = error?.error?.statusCode ?? error?.status ?? null;
        const backendMessage = error?.error?.message ?? error?.message ?? 'Error inesperado';

        if (statusCode === 429) {
            this.messageService.add({
                severity: 'warn',
                key: 'msg',
                summary: 'Demasiados intentos fallidos',
                detail: backendMessage,
                life: 5000
            });
            return;
        }

        if (statusCode === 404) {
            this.messageService.add({
                severity: 'error',
                key: 'msg',
                summary: 'Credenciales inválidas',
                detail: backendMessage,
                life: 4000
            });
            return;
        }

        if (statusCode === 401) {
            this.messageService.add({
                severity: 'error',
                key: 'msg',
                summary: 'Sesión inválida',
                detail: backendMessage,
                life: 4000
            });
            return;
        }

        if (statusCode === 403) {
            this.messageService.add({
                severity: 'error',
                key: 'msg',
                summary: 'Acceso denegado',
                detail: backendMessage,
                life: 4000
            });
            return;
        }

        this.messageService.add({
            severity: 'error',
            key: 'msg',
            summary: 'Hubo un error al ingresar la sesión',
            detail: backendMessage,
            life: 4000
        });
    }
}
