import { Offensives } from '@/api/offensives';

export class CourtEntry {
    id: string;
    idOffender: string;
    active: boolean;
    entryDate: string | null;
    createdAt: string;
    updatedAt: string;
    offensives: Offensives[];
}
