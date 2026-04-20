import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Select } from 'primeng/select';
import { AuthService } from '@/services/auth.service';
import { SessionService } from '@/services/session.service';
import { Auth } from '@/api/auth';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, Toast, Select, Password],
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
    listBranchs: { id: string; label: string }[] = [];
    constructor() {
        this.loginForm = this.fb.group({
            nickName: [null, Validators.required],
            password: [null, Validators.required],
            branch: [null]
        });
    }

    ngSubmitBranchs(): void {
        if (this.loginForm.get('nickName')?.invalid || this.loginForm.get('password')?.invalid) {
            this.messageService.add({ key: 'msg', severity: 'error', summary: 'Faltan campos por llenar', life: 3000 });
            return;
        }
        this.login();
    }
    ngSubmitLogin(): void {
        if (this.loginForm.get('branch').value == null) {
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
            next: (data: any) => {
                if (data.requiresBranchSelection) {
                    this.loginTicket = data.loginTicket;
                    this.listBranchs = data.branches ?? [];
                    this.visibleBranches = true;
                    this.loginForm.get('branch')?.setValue(null);
                    this.messageService.add({
                        severity: 'info',
                        key: 'msg',
                        summary: 'Selecciona la sucursal para continuar',
                        life: 3000
                    });
                    return;
                }
                if (data.statusCode != 404) {
                    this.messageService.add({ severity: 'success', key: 'msg', summary: 'Inicio de sesión exitoso', life: 3000 });
                    this.sessionService.setToken(data.token);
                    this.sessionService.setBranch(data.branch);
                    this.visibleBranches = false;
                    this.loginTicket = null;
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
