export interface Module {
    id: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    name: string;
    description?: string;
}

export interface Right {
    id: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    add: boolean;
    update: boolean;
    delete: boolean;
    list: boolean;
    disable: boolean;
    display: boolean;
    module: Module;
}

export class Role {
    id!: string;
    active!: boolean;
    createdAt!: string;
    updatedAt!: string;
    name!: string;
    rights!: Right[];
}
