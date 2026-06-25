import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginTenantDto, RegisterTenantDto, ChangePasswordDto } from './dto/auth.dto';
import { RequestUser } from './auth.types';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    loginTenant(dto: LoginTenantDto, req: Request): Promise<{
        accessToken: string;
        user: {
            id: number;
            name: string;
            isActive: boolean;
            phone: string | null;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: number;
            role: import(".prisma/client").$Enums.Role;
            jobTitle: string | null;
            avatarUrl: string | null;
            lastLoginAt: Date | null;
            lastLoginIp: string | null;
            createdBy: number | null;
        };
        tenant: {
            id: number;
            slug: string;
            name: string;
            plan: import(".prisma/client").$Enums.TenantPlan;
            isActive: boolean;
            maxUsers: number;
            storageQuotaMb: number;
            phone: string | null;
            website: string | null;
            gstin: string | null;
            industry: string | null;
            country: string;
            timezone: string;
            currency: string;
            isEmailVerified: boolean;
        };
    }>;
    registerTenant(dto: RegisterTenantDto, req: Request): Promise<{
        accessToken: string;
        user: {
            id: number;
            name: string;
            isActive: boolean;
            phone: string | null;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: number;
            role: import(".prisma/client").$Enums.Role;
            jobTitle: string | null;
            avatarUrl: string | null;
            lastLoginAt: Date | null;
            lastLoginIp: string | null;
            createdBy: number | null;
        };
        tenant: {
            id: number;
            slug: string;
            name: string;
            plan: import(".prisma/client").$Enums.TenantPlan;
            isActive: boolean;
            maxUsers: number;
            storageQuotaMb: number;
            timezone: string;
            currency: string;
            country: string;
        };
        message: string;
    }>;
    me(user: RequestUser): Promise<{
        user: {
            id: number;
            name: string;
            isActive: boolean;
            phone: string | null;
            email: string;
            createdAt: Date;
            tenantId: number;
            role: import(".prisma/client").$Enums.Role;
            jobTitle: string | null;
            avatarUrl: string | null;
        };
        tenant: {
            id: number;
            slug: string;
            name: string;
            plan: import(".prisma/client").$Enums.TenantPlan;
            isActive: boolean;
            maxUsers: number;
            storageQuotaMb: number;
            phone: string | null;
            gstin: string | null;
            industry: string | null;
            country: string;
            timezone: string;
            currency: string;
        };
    }>;
    changePassword(user: RequestUser, dto: ChangePasswordDto, req: Request): Promise<{
        message: string;
    }>;
}
