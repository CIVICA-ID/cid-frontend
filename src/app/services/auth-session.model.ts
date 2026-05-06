import { HttpContextToken } from '@angular/common/http';

export interface BranchOption {
    id: string;
    label: string;
}

export interface AuthLoginResponse {
    statusCode?: number;
    accessToken?: string;
    expiresAt?: string | number | Date;
    expiresIn?: number;
    branch?: string;
    fullName?: string;
    image?: string;
    id?: string;
    rights?: unknown;
    email?: string;
    nickName?: string;
    requiresBranchSelection?: boolean;
    loginTicket?: string;
    branches?: BranchOption[];
}

export interface SessionSnapshot {
    accessTokenExpiresAt?: number | null;
    branch?: string | null;
    fullName?: string | null;
    image?: string | null;
    id?: string | null;
    rights?: unknown;
    email?: string | null;
    nickName?: string | null;
}

export interface RefreshRequest {
    branch?: string | null;
}

export const SKIP_AUTH_INTERCEPTOR = new HttpContextToken<boolean>(() => false);
