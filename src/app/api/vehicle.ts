export interface Vehicle {
    id: string;
    brand: string;
    subbrand?: string;
    idState: string;
    model: string;
    color?: string;
    tonality?: string;
    plates: string;
    vin: string;
    idstate?: string;
    active: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}
