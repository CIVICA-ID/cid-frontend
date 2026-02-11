export interface Element {
    id: string;
    active: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    grade: string;
    firstName: string;
    paternalName: string;
    maternalName: string;
    unit: string;
}
