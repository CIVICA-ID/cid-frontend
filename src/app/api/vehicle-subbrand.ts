import { VehicleBrand } from '@/api/vehicle-brand';

export interface VehicleSubBrand {
    id: string;
    brand: VehicleBrand;
    name: string;

    active: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}
