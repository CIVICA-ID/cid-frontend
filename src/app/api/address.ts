export interface Address {
    id: string;
    active: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    street: string;
    externalNumber: number;
    internalNumber: number;
    cross1: string;
    cross2: string;
    municipality: string | null;
    state: string;
    region: string;
    colony: string;
    country: string;
    operationalArea: string;
    place: string;
    principal: boolean;
    type: string;
}
