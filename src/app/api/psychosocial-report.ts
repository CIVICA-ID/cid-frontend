export interface PsychosocialReport {
  id: string;
  active?: boolean;
  processed?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  id_offender?: string | null;
  id_staff?: string | null;
  dictation?: string | null;
  observations?: string | null;
  dictation_date?: Date | string | null;
  offender?: any;
  staff?: any;
}
