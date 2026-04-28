import { CaptureMode, SegmentedFinger } from "@/api/realscan";
//interfaces principales
export interface TenFingerCapture{
    leftThumb?: string;
    leftIndex?: string;
    leftMiddle?: string;
    leftRing?: string;
    leftLittle?: string;
    rightThumb?: string;
    rightIndex?: string;
    rightMiddle?: string;
    rightRing?: string;
    rightLittle?: string;
}

export type FingerKey = keyof TenFingerCapture;

export interface FingerDef {
    key: FingerKey;
    label: string;
    hand: 'left' | 'right';
}

export interface FingerSearchOption{
    key: string,
    label: string;
    hand: 'left' | 'right';
}
// Tipos de captura
export type EnrollMode = 'select' | 'full' | 'custom';
export type FullCaptureStep = 'left-four' | 'right-four' | 'two-thumbs';
export type GroupCaptureType = 'left-four' | 'right-four' | 'two-thumbs' | 'single';

export interface CaptureQueueItem {
    finger: FingerDef;
    captured?: SegmentedFinger
}

export interface FullStepIndicator {
    step: FullCaptureStep;
    label: string;
}

export interface FingerThumbnail {
    key: FingerKey;
    label: string;
}

export interface CaptureGroup{
    type: GroupCaptureType;
    label: string;
    fingers: FingerDef[];
    captureMode: CaptureMode;
    capturedFingers?: SegmentedFinger[];
    capturedSingle?: SegmentedFinger;
    imageFormat?: string;
}
// Constantes
export const All_FINGERS: FingerDef[] = [
    {key: 'leftThumb', label: 'Pulgar Izquierdo', hand: 'left'}, {key: 'rightThumb', label: 'Pulgar Derecho', hand: 'right'},
    {key: 'leftIndex', label: 'Indice Izquierdo', hand: 'left'}, {key: 'rightIndex', label: 'Indice Derecho', hand: 'right'},
    {key: 'leftMiddle', label: 'Medio Izquierdo', hand: 'left'}, {key: 'rightMiddle', label: 'Medio Derecho', hand: 'right'},
    {key: 'leftRing', label: 'Anular Izquierdo', hand: 'left'}, {key: 'rightRing', label: 'Anular Derecho', hand: 'right'},
    {key: 'leftLittle', label: 'Meñique Izquierdo', hand: 'left'}, {key: 'rightLittle', label: 'Meñique Derecho', hand: 'right'}
];
export const LEFT_FINGER_DEFINITIONS = All_FINGERS.filter(finger => finger.hand === 'left');
export const RIGHT_FINGER_DEFINITIONS = All_FINGERS.filter(finger => finger.hand === 'right');

export const FINGER_SEARCH_OPTIONS: FingerSearchOption[] =
    All_FINGERS.map(finger => ({ key: finger.key, label: finger.label, hand: finger.hand }));

export const LEFT_FINGER_SEARCH_OPTIONS = FINGER_SEARCH_OPTIONS.filter(option => option.hand === 'left');
export const RIGHT_FINGER_SEARCH_OPTIONS = FINGER_SEARCH_OPTIONS.filter(option => option.hand === 'right');

export const FULL_CAPTURE_STEP_INDICATORS: FullStepIndicator[] = [
    { step: 'left-four',  label: '4 Izq.' },
    { step: 'right-four', label: '4 Der.' },
    { step: 'two-thumbs', label: '2 Pulgares' },
];

export const FULL_CAPTURE_STEP_ORDER: FullCaptureStep[] = [
    'left-four', 'right-four', 'two-thumbs'
];

export const LEFT_SLAP_FINGER_NAMES = ['Indice', 'Medio', 'Anular', 'Meñique'];
export const RIGHT_SLAP_FINGER_NAMES = ['Meñique', 'Anular', 'Medio', 'Indice'];

export const LEFT_FINGER_THUMBNAILS: FingerThumbnail[] = [
    { key: 'leftThumb',  label: 'Pulgar' },
    { key: 'leftIndex',  label: 'Indice' },
    { key: 'leftMiddle', label: 'Medio' },
    { key: 'leftRing',   label: 'Anular' },
    { key: 'leftLittle', label: 'Meñique' },
];

export const RIGHT_FINGER_THUMBNAILS: FingerThumbnail[] = [
    { key: 'rightThumb',  label: 'Pulgar' },
    { key: 'rightIndex',  label: 'Indice' },
    { key: 'rightMiddle', label: 'Medio' },
    { key: 'rightRing',   label: 'Anular' },
    { key: 'rightLittle', label: 'Meñique' },
];
// Mapeop SDK finger type
export const SDK_FINGER_TYPE_MAP = {
    LEFT: { INDEX: 7, MIDDLE: 8, RING: 9, LITTLE: 10 },
    RIGHT: { INDEX: 2, MIDDLE: 3, RING: 4, LITTLE: 5 },
    THUMB: {LEFT: 6, RIGHT: 1}
} as const;

export const LEFT_FALLBACK_ORDER: FingerKey[] = ['leftLittle', 'leftRing', 'leftMiddle', 'leftIndex'];
export const RIGHT_FALLBACK_ORDER: FingerKey[] = ['rightIndex', 'rightMiddle', 'rightRing', 'rightLittle'];

const LEFT_FOUR_KEYS: FingerKey[] = ['leftIndex', 'leftMiddle', 'leftRing', 'leftLittle'];
const RIGHT_FOUR_KEYS: FingerKey[] = ['rightIndex', 'rightMiddle', 'rightRing', 'rightLittle'];
// Estilos por tipo de grupo
export interface GroupStyle{
    border: string;
    bg: string;
    text: string;
}
export const GROUP_STYLES: Record<GroupCaptureType, GroupStyle> = {
    'left-four': { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-700'},
    'right-four': { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-700'},
    'two-thumbs': { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-700'},
    'single': { border: 'border-purple-300', bg: 'bg-purple-50', text: 'text-purple-700'}
};
export function getGroupStyle(type: GroupCaptureType | undefined): GroupStyle{
    return GROUP_STYLES[type ?? 'single'];
}
// Funciones de agrupacion para captura
export function buildGroups(selectedKeys: Set<FingerKey>): CaptureGroup[]{
    const groups: CaptureGroup[] = [];
    const consumed = new Set<FingerKey>();
    // 4 dedos izquierdos
    const hasAllLeftFour = LEFT_FOUR_KEYS.every(k => selectedKeys.has(k));
    if(hasAllLeftFour){
        const fingers = All_FINGERS.filter(f => LEFT_FOUR_KEYS.includes(f.key));
        groups.push({
            type: 'left-four',
            label: '4 Dedos Izquierdos',
            fingers,
            captureMode: CaptureMode.FLAT_LEFT_FOUR_FINGERS,
            imageFormat: 'bmp'
        });
        LEFT_FOUR_KEYS.forEach(k => consumed.add(k));
    }
    // 4 dedos derechos
    const hasAllRightFour = RIGHT_FOUR_KEYS.every(k => selectedKeys.has(k));
    if(hasAllRightFour){
        const fingers = All_FINGERS.filter(f => RIGHT_FOUR_KEYS.includes(f.key));
        groups.push({
            type: 'right-four',
            label: '4 Dedos Derechos',
            fingers,
            captureMode: CaptureMode.FLAT_RIGHT_FOUR_FINGERS,
            imageFormat: 'bmp'
        });
        RIGHT_FOUR_KEYS.forEach(k => consumed.add(k));
    }
    // 2 Pulgares
    const hasLeftThumb = selectedKeys.has('leftThumb') && !consumed.has('leftThumb');
    const hasRightThumb = selectedKeys.has('rightThumb') && !consumed.has('rightThumb');
    if(hasLeftThumb && hasRightThumb){
        const fingers = All_FINGERS.filter(f => f.key === 'leftThumb' || f.key === 'rightThumb');
        groups.push({
            type: 'two-thumbs',
            label: '2 Pulgares',
            fingers,
            captureMode: CaptureMode.FLAT_TWO_FINGERS_EX,
            imageFormat: 'bmp'
        });
        consumed.add('leftThumb');
        consumed.add('rightThumb');
    }
    // Restantes como individuales
    const remaining = All_FINGERS.filter(f => selectedKeys.has(f.key) && !consumed.has(f.key));

    const leftRemaining = remaining.filter(f => f.hand === 'left');
    const rightRemaining = remaining.filter(f => f.hand === 'right');

    for(const finger of [...leftRemaining, ...rightRemaining]){
        groups.push({
            type: 'single',
            label: finger.label,
            fingers: [finger],
            captureMode: CaptureMode.FLAT_SINGLE_FINGER_EX,
            imageFormat: 'bmp'
        });
    }

    const leftGroups = groups.filter(
        g => g.type === 'left-four' ||
        (g.type === 'single' && g.fingers[0].hand === 'left')
    );
    const rightGroups = groups.filter(
        g => g.type === 'right-four' ||
        (g.type === 'single' && g.fingers[0].hand === 'right')
    );
    const thumbsGroup = groups.filter(g => g.type === 'two-thumbs');

    return [
        ...leftGroups,
        ...rightGroups,
        ...thumbsGroup
    ];
}

export function describeGroups(groups: CaptureGroup[]): string{
    const totalCaptures = groups.length;
    const totalFingers = groups.reduce((sum, g) => sum + g.fingers.length, 0);
    return `${totalFingers} dedos en ${totalCaptures} captura(s)`;
}
// Asigna dedos segmentados del SDK a la estructura TenFingerCapture, manejando tipos tanto conocidos como desconocidos
export function assignFingersToCapture(
    fingers: SegmentedFinger[],
    hand: 'left' | 'right',
    result: TenFingerCapture
): void {
    const typeMap = hand === 'left' ? SDK_FINGER_TYPE_MAP.LEFT : SDK_FINGER_TYPE_MAP.RIGHT;
    const fallbackOrder = hand === 'left' ? LEFT_FALLBACK_ORDER : RIGHT_FALLBACK_ORDER;
    const prefix = hand;

    // Asignar por fingertype conocido
    for (const finger of fingers) {
        if(finger.fingerType === typeMap.INDEX) result[`${prefix}Index` as FingerKey] = finger.imageBase64;
        if(finger.fingerType === typeMap.MIDDLE) result[`${prefix}Middle` as FingerKey] = finger.imageBase64;
        if(finger.fingerType === typeMap.RING) result[`${prefix}Ring` as FingerKey] = finger.imageBase64;
        if(finger.fingerType === typeMap.LITTLE) result[`${prefix}Little` as FingerKey] = finger.imageBase64;
    }
    // fallback para fingertype desconocido(fingertype = 0) por posicion fisica
    const unknowns = fingers.filter(f => !f.fingerType);
    fallbackOrder.forEach((fingerKey, index) => {
        if(unknowns[index] && !result[fingerKey]){
            result[fingerKey] = unknowns[index].imageBase64;
        }
    });
}

// Asigna pulgares segmentados del SDK a la estructura TenFingerCapture
export function assignThumbsToCapture(fingers: SegmentedFinger[], result: TenFingerCapture): void{
    for(const finger of fingers){
        if(finger.fingerType === SDK_FINGER_TYPE_MAP.THUMB.LEFT){
            result.leftThumb = finger.imageBase64;
        }else if(finger.fingerType === SDK_FINGER_TYPE_MAP.THUMB.RIGHT){
            result.rightThumb = finger.imageBase64;
        }
    }
    // Pulgares fingertype desconocidos
    const unknowns = fingers.filter(
        f => f.fingerType !== SDK_FINGER_TYPE_MAP.THUMB.LEFT &&
            f.fingerType !== SDK_FINGER_TYPE_MAP.THUMB.RIGHT
    );
    if(unknowns.length >= 2 && !result.leftThumb && !result.rightThumb){
        result.leftThumb = unknowns[0].imageBase64;
        result.rightThumb = unknowns[1].imageBase64;
    }else if(unknowns.length === 1){
        if(!result.leftThumb){
            result.leftThumb = unknowns[0].imageBase64;
        }else if(!result.rightThumb){
            result.rightThumb = unknowns[0].imageBase64;
        }
    }
}
// Se construye el TenFingerCapture completo
export function assignSlapFingersToCapture(
    leftFourFingers: SegmentedFinger[],
    rightFourFingers: SegmentedFinger[],
    bothThumbs: SegmentedFinger[]
): TenFingerCapture{
    const result: TenFingerCapture = {};
    assignFingersToCapture(leftFourFingers, 'left', result);
    assignFingersToCapture(rightFourFingers, 'right', result);
    assignThumbsToCapture(bothThumbs, result);
    return result;
}
// Funciones
export function getScoreColorClass(score: number): string {
    if (score >= 100) return 'text-green-600';
    if (score >= 60)  return 'text-blue-600';
    if (score >= 40)  return 'text-yellow-600';
    return 'text-red-600';
}

export function formatElapsedTime(milliseconds: number): string {
    if (!milliseconds || milliseconds <= 0) return '0ms';
    if (milliseconds < 1000) return `${milliseconds}ms`;
    return `${(milliseconds / 1000).toFixed(2)}s`;
}

export function formatPageRange(currentPage: number, pageSize: number, totalRows: number): string {
    if (totalRows <= 0) return 'Mostrando del 0 al 0 de 0 registros';
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(startIndex + pageSize - 1, totalRows);
    return `Mostrando del ${startIndex} al ${endIndex} de ${totalRows} registros`;
}

export function buildImageDataUrl(base64Data: string, format: string = 'bmp'): string {
    return `data:image/${format};base64,${base64Data}`;
}

export function rotateImageFormat(currentFormat: string): string {
    const rotation: Record<string, string> = {
        bmp: 'png',
        png: 'jpg'
    };
    return rotation[currentFormat] ?? 'bmp';
}

export function countCapturedFingers(fingers: TenFingerCapture): number {
    return Object.values(fingers).filter(Boolean).length;
}

