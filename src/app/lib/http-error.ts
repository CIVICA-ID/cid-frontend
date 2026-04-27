import { HttpErrorResponse } from '@angular/common/http';

export function buildSaveErrorDetail(error: unknown, entityLabel: string): string {
    const defaultMessage = `Error al guardar ${entityLabel}`;

    if (error instanceof HttpErrorResponse) {
        if (error.status === 409) {
            return 'La solicitud ya se envió o sigue en proceso. Espera unos segundos antes de volver a intentarlo.';
        }

        const backendMessage = typeof error.error?.message === 'string' ? error.error.message.trim() : '';
        if (backendMessage) {
            return `${defaultMessage}, error: ${backendMessage}`;
        }

        if (error.message) {
            return `${defaultMessage}, error: ${error.message}`;
        }

        return defaultMessage;
    }

    if (error && typeof error === 'object' && 'message' in error) {
        const message = String((error as { message?: unknown }).message ?? '').trim();
        if (message) {
            return `${defaultMessage}, error: ${message}`;
        }
    }

    return defaultMessage;
}
