import { People } from '@/api/people';
import { Audience } from '@/api/audiences';

export interface Witness {
    idPeople: string;
    idAudience?: string;

    people?: People;
    audience?: Audience;
}
