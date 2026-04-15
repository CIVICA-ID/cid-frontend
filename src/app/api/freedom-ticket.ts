export interface FreedomTicket {
  id: string;
  active?: boolean;
  processed?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  idCellStay: string;
  offenderName?: string;
  releaseDateDate?: string;
  releaseDateTime?: string;
  arrestHours: number;
  fineAmount?: number | null;
  releaseDate: Date | string;
  civilJudge: string;
  custodian: string;
  exitReason: string;
  paymentTicketFolio?: string | null;
  observations?: string | null;
  cellStay?: any;
}
