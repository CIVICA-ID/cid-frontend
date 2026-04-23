import { Witness } from '@/api/witness';

export interface Audience {
    id?: number; // Generalmente las entidades tienen un ID
    startDate: Date | string;
    endDate: Date | string;
    sentence: string;
    civilJudge: string;
    secretary: string;
    sanction?: string;
    sanctionVariant?: string;
    description?: string;
    observations?: string;

    idCourtEntry?: number;
    tracings?: any[];
    witnesses?: Witness[];
}
