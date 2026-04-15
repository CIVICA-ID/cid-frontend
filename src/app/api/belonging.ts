export interface Belonging {
  id: string;
  active?: boolean;
  processed?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  id_cell_stay: string;
  belonging?: string | null;
  recipient: string;
  value: number;
  serialNumber?: string | null;
  brand?: string | null;
  description?: string | null;
  quantity: number;
  measurementUnit: string;
  observation?: string | null;
  offenderName?: string;
  cellStay?: any;
}
