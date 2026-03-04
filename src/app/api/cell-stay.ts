export interface CellStay {
  id: string;
  active?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  cellRegister: string;
  entryDate?: Date | string | null;
  observations?: string | null;
  id_offender?: string | null;
  offender?: any;
  belongings?: any[];
  freedomTickets?: any;
}
