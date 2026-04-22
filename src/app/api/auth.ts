import { BranchOption } from '@/services/auth-session.model';

export class Auth {
    nickName!: string;
    password?: string;
    branch?: string;
    loginTicket?: string;
    requiresBranchSelection?: boolean;
    branches?: BranchOption[];
}
