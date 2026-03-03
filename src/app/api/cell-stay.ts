export interface CellStay {
  id: string;
  active?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  cellRegister: string;
  entryDate?: Date | string | null;
  observations?: string | null;
  belongings?: any[];
  freedomTickets?: any;
}
