export interface PsychosocialReport {
  id: string;
  active?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  id_offender: string;
  id_staff: string;
  dictation: string;
  observations?: string | null;
  dictation_date: Date | string;
  offender?: any;
  staff?: any;
}
