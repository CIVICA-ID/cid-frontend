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
    involvedVehicle: InvolvedVehicle[];
}

export interface InvolvedVehicle {
    id: string;
    active: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    idService: string;
    idVehicle: string | Vehicle;
    vehicle?: Vehicle;
    theftReport: string;
    deposit: string;
}
