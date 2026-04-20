export  class Auth {
    nickName!: string;
    password?: string;
    branch?: string;
    loginTicket?: string;
    requiresBranchSelection?: boolean;
    branches?: { id: string; label: string }[];
}
