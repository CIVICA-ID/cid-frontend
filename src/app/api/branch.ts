export interface Branch {
    id: string; // UUID
    active: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    name: string; // Ej: "Suc 1"
    statusCode?: number;
}
