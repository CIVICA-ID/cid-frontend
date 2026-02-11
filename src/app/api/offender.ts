export interface Offender {
    id: string;
    active: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    arrestType: string;
    id_service: string;
    idPeople: string;
    id_administrative_fault: string;
}
