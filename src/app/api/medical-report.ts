export interface MedicalReport {
  id: string;
  active?: boolean;
  processed?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  id_staff?: string | null;
  id_offender?: string | null;
  rh_factor?: string | null;
  blood_type?: string | null;
  entry_status?: string | null;
  dictation?: string | null;
  observations?: string | null;
  weight?: number | null;
  height?: number | null;
  dictation_date?: Date | string | null;
  offender?: any;
  staff?: any;
}
