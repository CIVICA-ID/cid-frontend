export interface InvolvedVehicle {
    id: string;
    active: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    idService: string;
    idVehicle: string;
    theftReport: string;
    deposit: string;
}
