// export class People {
//     'id': string;
//     'firstName': string;
//     'paternalName': string;
//     'maternalName': string;
//     'birthDate': Date; // O string en formato ISO-8601
//     'alias': string;
//     'gender': string;
//     'maritalStatus': string;
//     'educationLevel': string;
//     'occupation': string;
//     'peopleAddresses': [
//         {
//             address: string; // UUID de la dirección (ID)
//         }
//     ];
//     'curp': string;
//     'arrestType'?: string;
//     administrativeFault: {
//         active: boolean;
//         createdAt: Date;
//         description: string;
//         id: string;
//         id_category: string;
//         updatedAt: Date;
//     };
// }

import { Address } from "./address";

export interface PeopleAddress{
    address: string;
    address_data: Address;
}

export interface AdministrativeFault{
    id: string;
    active: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    description: string;
    id_category: string;
}

export interface People{
    id: string;
    firstName: string;
    paternalName: string;
    maternalName: string;
    birthDate: Date | string;
    alias: string;
    gender: string;
    maritalStatus: string;
    educationLevel: string;
    occupation: string;
    peopleAddresses: PeopleAddress[];
    curp: string;
    arrestType?: string;
    administrativeFault?: AdministrativeFault;
}

export interface PaginatedResponse<T>{
    data: T[];
    meta: {
        totalItems: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}

export interface ApiResponse<T>{
    object: T;
    message?: string;
}
