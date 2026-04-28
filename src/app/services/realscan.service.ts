import { computed, Injectable, signal } from "@angular/core";
import { CaptureImageResponse, CaptureMode, Segment, CapturingStatusResponse, DeviceInfoResponse, InitDeviceResponse, InitSDKResponse, OperationResponse, RealScanStatus } from "../api/realscan";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { catchError, finalize, Observable, of, switchMap, tap, throwError } from "rxjs";


@Injectable({
  providedIn: 'root'
})
export class RealScanService {
  private readonly apiUrl = 'http://localhost:5001/api/realscan';
  // Estado de inicializacion del SDK
  readonly sdkInitialized = signal<boolean>(false);
  // Handle del dispositivo actualmente abierto
  readonly deviceHandle = signal<number | null>(null);
  // informacion del dispositivo
  readonly deviceInfo = signal<DeviceInfoResponse['deviceInfo'] | null>(null);
  // Estado de captura
  readonly isCapturing = signal<boolean>(false);
  // Numero de dispositivos detectados
  readonly numberOfDevices = signal<number>(0);
  // Estado de carga
  readonly loading = signal<boolean>(false);
  // Ultimo error
  readonly lastError = signal<string | null>(null);

  // Indica si hay un dispositivo listo para capturar
  readonly isDeviceReady = computed(() => {
    return this.sdkInitialized() && this.deviceHandle() !== null;
  });

  // Estado completo del SDK
  readonly status = computed<RealScanStatus>(() => ({
    sdkInitialized: this.sdkInitialized(),
    deviceHandle: this.deviceHandle(),
    deviceInfo: this.deviceInfo(),
    isCapturing: this.isCapturing(),
    lastError: this.lastError()
  }));

  constructor(private readonly http: HttpClient) { }
  // Operaciones del SDK
  initSDK(): Observable<InitSDKResponse> {
    this.loading.set(true);
    this.clearError();

    return this.http.post<InitSDKResponse>(`${this.apiUrl}/init-sdk`, {})
      .pipe(
        tap((response) => {
          if (response.success) {
            this.sdkInitialized.set(true);
            this.numberOfDevices.set(response.numberOfDevices);
            console.log('SDK inicializado:', response);
          } else {
            this.lastError.set(response.message);
            console.error('Error al inicializar SDK:', response.message);
          }
        }),
        catchError((error) => this.handleError(error, 'Error al inicializar SDK')),
        finalize(() => this.loading.set(false))
      );
  }

  initDevice(deviceIndex: number = 0): Observable<InitDeviceResponse> {
    if (!this.sdkInitialized()) {
      const error = 'SDK no inicializado, llame a initSDK() primero';
      this.lastError.set(error);
      return throwError(() => new Error(error));
    }
    this.loading.set(true);
    this.clearError();
    return this.http.post<InitDeviceResponse>(`${this.apiUrl}/init-device/${deviceIndex}`, {})
      .pipe(
        tap((response) => {
          if (response.success) {
            this.deviceHandle.set(response.deviceHandle);
            console.log('Dispositivo inicializado:', response);
            // Obtener informacion del dispositivo automaticamente
            this.getDeviceInfo(response.deviceHandle).subscribe();
          } else {
            this.lastError.set(response.message);
            console.error('Error al inicializar dispositivo', response.message);
          }
        }),
        catchError((error) => this.handleError(error, 'Error al inicializar dispositivo')),
        finalize(() => this.loading.set(false))
      );
  }

  getDeviceInfo(handle: number): Observable<DeviceInfoResponse> {
    return this.http.get<DeviceInfoResponse>(`${this.apiUrl}/device-info/${handle}`)
      .pipe(
        tap((response) => {
          if (response.success && response.deviceInfo) {
            this.deviceInfo.set(response.deviceInfo);
            console.log('Info del dispositivo: ', response.deviceInfo);
          }
        }),
        catchError((error) => this.handleError(error, 'Error al obtener info del dispositivo'))
      );
  }
  // Captura
  quickCapture(
    mode: CaptureMode = CaptureMode.FLAT_SINGLE_FINGER,
    timeout: number = 10000,
    segment: Segment = Segment.ENABLED
  ): Observable<CaptureImageResponse> {
    const handle = this.deviceHandle();
    if (handle === null) {
      const error = 'No hay dispositivo inicializado';
      this.lastError.set(error);
      return throwError(() => new Error(error));
    }

    this.loading.set(true);
    this.isCapturing.set(true);
    this.clearError();

    const url = `${this.apiUrl}/quick-capture/${handle}`;
    const params = {
      mode: mode,
      timeout: timeout.toString(),
      segment: segment
    };

    return this.http.post<CaptureImageResponse>(url, {}, { params })
      .pipe(
        tap((response) => {
          if (response.success) {
            console.log('Captura exitosa: ', response.width, 'x', response.height);
          } else {
            this.lastError.set(response.message);
            console.error('Error en la captura: ', response.message);
          }
        }),
        catchError((error) => this.handleError(error, 'Error durante la captura')),
        finalize(() => {
          this.loading.set(false);
          this.isCapturing.set(false);
        })
      );
  }

  checkCapturingStatus(handle: number): Observable<CapturingStatusResponse> {
    return this.http.get<CapturingStatusResponse>(`${this.apiUrl}/is-capturing/${handle}`)
      .pipe(
        tap((response) => {
          if (response.success && response.isCapturing !== undefined) {
            this.isCapturing.set(response.isCapturing);
          }
        }),
        catchError((error) => this.handleError(error, 'Error al verificar estado de captura'))
      );
  }
  // Liberacion de dispositivos
  exitDevice(): Observable<OperationResponse> {
    const handle = this.deviceHandle();

    if (handle === null) {
        return of({
            success: true,
            message: 'No hay dispositivo que liberar',
            errorCode: 0
        });
    }
    this.deviceHandle.set(null);
    this.deviceInfo.set(null);
    this.loading.set(true);

    return this.http.post<OperationResponse>(`${this.apiUrl}/exit-device/${handle}`, {})
      .pipe(
        tap((response) => {
          if (response.success) {
            console.log('Dispositivo liberado')
          } else {
            this.lastError.set(response.message);
          }
        }),
        catchError((error) => this.handleError(error, 'Error al liberar dispositivo')),
        finalize(() => this.loading.set(false))
      );
  }

  exitAllDevices(): Observable<OperationResponse> {
    if(!this.sdkInitialized()){
        return of({
            success: true,
            message: 'SDK no inicializado',
            errorCode: 0
        });
    }
    this.deviceHandle.set(null);
    this.deviceInfo.set(null),
    this.sdkInitialized.set(false);
    this.loading.set(true);

    return this.http.post<OperationResponse>(`${this.apiUrl}/exit-all-devices`, {})
      .pipe(
        tap((response) => {
          if (response.success) {
            console.log('Todos los dispositivos liberados');
          }
        }),
        catchError((error) => this.handleError(error, 'Error al liberar todos los dispositivos')),
        finalize(() => this.loading.set(false))
      );
  }
  // Reinicia el SDK, libera dispositios si hay alguno abierto y se vuelve a inicializar
  reset(): Observable<InitSDKResponse> {
    return this.deviceHandle() !== null
        ? this.exitAllDevices().pipe(switchMap(() => this.initSDK()))
        : this.initSDK();
  }
  // Inicializa SDK, el dispositivo y captura
  initAndCapture(
    deviceIndex: number = 0,
    mode: CaptureMode = CaptureMode.FLAT_SINGLE_FINGER,
    segment: Segment = Segment.ENABLED
  ): Observable<CaptureImageResponse> {
        return this.initSDK().pipe(
            tap(sdk => {
                if(!sdk.success){
                    throw new Error(sdk.message);
                }
            }),
            switchMap(() => this.initDevice(deviceIndex)),
            tap(device => {
                if(!device.success){
                    throw new Error(device.message);
                }
            }),
            switchMap(() => this.quickCapture(mode, 10000, segment))
        );
  }

  clearError(): void {
    this.lastError.set(null);
  }

  handleError(error: HttpErrorResponse, defaultMessage: string = 'Error desconocido'):Observable<never> {
    let errorMessage = defaultMessage;
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error de red: ${error.error.message}`;
    } else {
        const statusMessages: Record<number, string> = {
            0: 'No se puede conectar con el servidor Realscan, verifica que la API se este ejecutando',
            400: error.error?.message || 'Solicitud invalida',
            404: 'Endpoint no encontrado, verificar la URL de la API',
            500: error.error?.message || 'Error interno del servidor Realscan'
        };
        errorMessage = statusMessages[error.status] || error.error?.message || error.message || defaultMessage;
    }

    console.error('Error en RealScanService:', {
      status: error.status,
      message: errorMessage,
      url: error.url,
    });

    this.lastError.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
