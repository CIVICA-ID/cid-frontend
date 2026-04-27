import { HttpErrorResponse } from '@angular/common/http';
import { buildSaveErrorDetail } from './http-error';

describe('buildSaveErrorDetail', () => {
    it('returns a friendly message for a 409 conflict', () => {
        // Arrange
        const error = new HttpErrorResponse({
            status: 409,
            statusText: 'Conflict',
            error: { message: 'already processed' }
        });

        // Act
        const result = buildSaveErrorDetail(error, 'el registro');

        // Assert
        expect(result).toBe('La solicitud ya se envió o sigue en proceso. Espera unos segundos antes de volver a intentarlo.');
    });

    it('uses the backend message when the error is not 409', () => {
        // Arrange
        const error = new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: { message: 'campo inválido' }
        });

        // Act
        const result = buildSaveErrorDetail(error, 'el registro');

        // Assert
        expect(result).toBe('Error al guardar el registro, error: campo inválido');
    });

    it('falls back to the default message when the error is not an HttpErrorResponse and has no message', () => {
        // Arrange
        const error = {};

        // Act
        const result = buildSaveErrorDetail(error, 'el registro');

        // Assert
        expect(result).toBe('Error al guardar el registro');
    });
});
