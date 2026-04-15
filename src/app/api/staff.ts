export interface Staff {
  id: string;
  active?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  full_name: string;
  professional_license: string;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
}
