import { Address } from '@/api/address';
import { Affected } from '@/api/affected';
import { Offender } from '@/api/offender';
import { InvolvedVehicle } from '@/api/involvedVehicle';
import { Element } from '@/api/element';

export interface Service {
    id: string;
    active: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    processed: boolean;
    idBranch: string;
    externalFolio: string | null;
    iphFolio: string | null;
    captureDate: Date | string;
    serviceDate: Date | string;
    dateReception: Date | string;
    arrivalDate: Date | string;
    endDate: Date | string;
    arrestDate: Date | string;
    submissionDate: Date | string;
    description: string;
    address: Address;
    elements: Element[];
    affected: Affected[];
    offenders: Offender[];
    involvedVehicle: InvolvedVehicle;
}
