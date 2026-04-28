import { Observable } from "rxjs";

export interface FileReadResult{
    dataUrl: string;
    base64: string;
}
// Lee un archivo base64 y devuelve observable
export function readFileAsBase64(file: File, allowedTypes: readonly string[]): Observable<FileReadResult>{
    return new Observable(observer => {
        if(!allowedTypes.includes(file.type.toLowerCase())){
            observer.error(new Error('Formato no valido'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if(dataUrl){
                observer.next({
                    dataUrl,
                    base64: dataUrl.split(',')[1]
                });
                observer.complete();
            } else{
                observer.error(new Error('No se pudo leer el archivo'));
            }
        };
        reader.onerror = () => observer.error(new Error('Error al leer archivo'));
        reader.readAsDataURL(file);
    });
}
// Extrae un archivo del evento de un input y lo limpia
export function extractFileFromEvent(event: Event): File | null{
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    return file;
}
// Tipos de imagenes aceptados
export const IMAGE_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/bmp',
    'image/webp'
] as const;
