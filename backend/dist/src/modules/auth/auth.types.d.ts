export interface JwtPayload {
    sub: number;
    email: string;
    role: string;
    tenantId: number;
    iat?: number;
    exp?: number;
}
export interface RequestUser {
    id: number;
    email: string;
    role: string;
    tenantId: number;
}
