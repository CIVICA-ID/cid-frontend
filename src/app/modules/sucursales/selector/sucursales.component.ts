import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '@/services/auth.service';
import { SessionService } from '@/services/session.service';
import { AuthLoginResponse, BranchOption } from '@/services/auth-session.model';

@Component({
    selector: 'app-sucursales',
    standalone: true,
    imports: [CommonModule, Toast],
    templateUrl: './sucursales.component.html',
    providers: [MessageService]
})
export class SucursalesComponent implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly sessionService = inject(SessionService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    currentYear = new Date().getFullYear();
    loading = true;
    branches: BranchOption[] = [];
    selectedBranchId: string | null = this.sessionService.getBranch();
    currentBranchId: string | null = this.sessionService.getBranch();
    nickName: string | null = this.sessionService.getNickName();

    ngOnInit(): void {
        if (!this.nickName) {
            this.router.navigate(['/auth/login']);
            return;
        }

        this.loadBranches();
    }

    selectBranch(branchId: string): void {
        this.selectedBranchId = branchId;
    }

    isCurrentBranch(branchId: string): boolean {
        return this.currentBranchId === branchId;
    }

    returnHome(): void {
        this.router.navigate(['/']);
    }

    confirmBranch(): void {
        if (!this.selectedBranchId) {
            this.messageService.add({
                key: 'msg',
                severity: 'error',
                summary: 'Selecciona una sucursal para continuar',
                life: 3000
            });
            return;
        }

        this.loading = true;
        this.authService.refresh({ branch: this.selectedBranchId }).subscribe({
            next: (data: AuthLoginResponse) => {
                this.sessionService.setSession(data);
                this.messageService.add({
                    key: 'msg',
                    severity: 'success',
                    summary: 'Sucursal actualizada',
                    life: 2500
                });
                this.router.navigate(['/']);
            },
            error: (error) => {
                this.loading = false;
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    summary: 'No se pudo cambiar la sucursal',
                    detail: error?.error?.message ?? error.message ?? 'Error inesperado',
                    life: 4000
                });
            }
        });
    }

    private loadBranches(): void {
        this.loading = true;
        this.authService.getBranches(this.nickName!).subscribe({
            next: (branches: BranchOption[] | any) => {
                this.branches = branches ?? [];
                if (this.branches.length === 0) {
                    this.selectedBranchId = null;
                }
                const selectedBranchExists = this.branches.some((branch) => branch.id === this.selectedBranchId);
                if (!selectedBranchExists && this.branches.length > 0) {
                    this.selectedBranchId = this.branches[0].id;
                }
                this.loading = false;
            },
            error: (error) => {
                this.loading = false;
                this.messageService.add({
                    key: 'msg',
                    severity: 'error',
                    summary: 'No se pudieron cargar las sucursales',
                    detail: error?.error?.message ?? error.message ?? 'Error inesperado',
                    life: 4000
                });
            }
        });
    }
}
