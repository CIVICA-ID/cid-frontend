export class Address {
    id:string;
    street!: string;
    externalNumber!: number;
    internalNumber?: number;
    cross1?: string;
    cross2?: string;
    municipality!: string;
    state!: string;
    region?: string;
    colony!: string;
    country!: string;
    operationalArea?: string;
    place?: string;
    principal: boolean;
    type!: string;
}