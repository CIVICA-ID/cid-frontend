import { HttpErrorResponse } from "@angular/common/http";
import { signal } from "@angular/core";
import { catchError, finalize, Observable, throwError } from "rxjs";

export abstract class BaseApiService{
    readonly loading =signal(false);
    readonly lastError = signal<string | null>(null);

    clearError(): void{
        this.lastError.set(null);
    }

    protected executeRequest<T>(request$: Observable<T>): Observable<T>{
        this.loading.set(true);
        this.clearError();

        return request$.pipe(
            catchError((error: HttpErrorResponse) => {
                const message = this.extractErrorMessage(error);
                this.lastError.set(message);
                return throwError(() => new Error(message));
            }),
            finalize(() => this.loading.set(false))
        );
    }

    protected extractErrorMessage(error: HttpErrorResponse, statusOverrides: Record<number, string> = {}): string{
        if(error.error instanceof ErrorEvent){
            return `Error de red: ${error.error.message}`;
        }

        const serverMessage = error.error?.message;

        const defaults: Record<number, string> = {
            0: 'No se puede conectar con el servidor',
            400: 'Solicitud invalida',
            404: 'Recurso no encontrado',
            500: 'Error interno del servidor',
            ...statusOverrides
        };
        return serverMessage || defaults[error.status] || error.message || 'Error desconocido';
    }
}
