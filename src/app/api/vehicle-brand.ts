import { VehicleSubBrand } from '@/api/vehicle-subbrand';

export interface VehicleBrand {
    id: string;
    idBrand: string;
    name: string;

    subbrands: VehicleSubBrand[];
    active: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}
