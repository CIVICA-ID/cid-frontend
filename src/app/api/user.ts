export class User {
    id!: string;
    active!: boolean;
    createdAt!: Date | string;
    updatedAt!: Date | string;
    fullName!: string;
    nickName!: string;
    email!: string;
    emailStatus!: 'confirmed' | 'unconfirmed' | string;
    emailProofToken?: string | null;
    emailProofTokenExpiresAt?: Date | string | null;
    password!: string;
    passwordResetToken?: string | null;
    passwordResetTokenExpiresAt?: Date | string | null;
    evidence?: any | null;

    //mensaje de error
    object?:boolean | null;
}
