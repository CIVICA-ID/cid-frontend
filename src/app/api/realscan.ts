// Respuesta de inicialización del SDK
export interface InitSDKResponse {
  errorCode: number;
  numberOfDevices: number;
  message: string;
  success: boolean;
}

// Respuesta de inicializacion de dispositivo
export interface InitDeviceResponse {
  errorCode: number;
  deviceHandle: number;
  message: string;
  success: boolean;
}

// Respuesta de informacion del dispositivo
export interface DeviceInfoResponse {
  errorCode: number;
  message: string;
  success: boolean;
  deviceInfo?: {
    deviceType: number;
    deviceTypeName: string;
    productName: string;
    deviceID: string;
    firmwareVersion: string;
    hardwareVersion: string;
  };
}

// Dedo segmentado individual
export interface SegmentedFinger {
  fingerIndex: number;
  fingerType: number;   // RSFingerType numérico: 1=RThumb,2=RIndex,3=RMiddle,4=RRing,5=RLittle,6=LThumb,7=LIndex,8=LMiddle,9=LRing,10=LLittle, 0=desconocido
  fingerTypeName: string;
  fingerTypeDescription?: string;
  width: number;
  height: number;
  imageBase64: string;
}

// Respuesta de captura de imagen
export interface CaptureImageResponse {
  errorCode: number;
  message: string;
  success: boolean;
  imageBase64?: string;
  width?: number;
  height?: number;
  filename?: string;
  numberOfFingers?: number;
  fingers?: SegmentedFinger[];    // ARRAY — el backend devuelve List<SegmentedFinger>
}

// Respuesta de operacion simple
export interface OperationResponse {
  errorCode: number;
  message: string;
  success: boolean;
}
// Respuesta de estado de captura
export interface CapturingStatusResponse {
  errorCode: number;
  message: string;
  success: boolean;
  isCapturing?: boolean;
}

// Modos de captura disponibles
export enum CaptureMode {
  FLAT_SINGLE_FINGER = 'RS_CAPTURE_FLAT_SINGLE_FINGER', /*| 1 dedo plano |*/
  FLAT_SINGLE_FINGER_EX = 'RS_CAPTURE_FLAT_SINGLE_FINGER_EX', /*| 1 dedo plano extendido |*/
  ROLL_FINGER = 'RS_CAPTURE_ROLL_FINGER', /*| 1 dedo rodado |*/
  ROLL_FINGER_EX = 'RS_CAPTURE_ROLL_FINGER_EX', /*| 1 dedo rodado extendido |*/
  FLAT_TWO_FINGERS = 'RS_CAPTURE_FLAT_TWO_FINGERS', /*| 2 dedos |*/
  FLAT_TWO_FINGERS_EX = 'RS_CAPTURE_FLAT_TWO_FINGERS_EX', /*| 2 dedos extendido |*/
  FLAT_LEFT_FOUR_FINGERS = 'RS_CAPTURE_FLAT_LEFT_FOUR_FINGERS', /*| 4 dedos izquierdos |*/
  FLAT_RIGHT_FOUR_FINGERS = 'RS_CAPTURE_FLAT_RIGHT_FOUR_FINGERS' /*| 4 dedos derechos |*/
}

// Bandera para activar o desactivar segmentacion
export enum Segment {
  ENABLED = 'true',
  DISABLED = 'false'
}

// Estado del SDK RealScan
export interface RealScanStatus {
  sdkInitialized: boolean;
  deviceHandle: number | null;
  deviceInfo: DeviceInfoResponse['deviceInfo'] | null;
  isCapturing: boolean;
  lastError: string | null;
}
