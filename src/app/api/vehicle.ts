export interface Vehicle {
    id: string;
    idBrand: string;
    idSubBrand?: string;
    idState: string;
    model: string;
    idColor?: string;
    tonality?: string;
    plates: string;
    vin: string;
    idstate?: string;
    active: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    // involvedVehicle: InvolvedVehicle[];
}
