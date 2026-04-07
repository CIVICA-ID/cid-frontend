export interface Seguimiento {
  id: string;
  active?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  idOffender?: string | null;
  idAudience?: string | null;
  followType: string;
  followDate?: Date | string | null;
  description: string;
  offender?: {
    id?: string;
    people?: {
      firstName?: string;
      paternalName?: string;
      maternalName?: string;
    };
  } | null;
}
