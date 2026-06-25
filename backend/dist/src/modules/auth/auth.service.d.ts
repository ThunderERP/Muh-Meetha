import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { LoginTenantDto, RegisterTenantDto, ChangePasswordDto } from './dto/auth.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly events;
    private readonly logger;
    private readonly bcryptRounds;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, events: EventEmitter2);
    loginByTenant(dto: LoginTenantDto, ip?: string): Promise<{
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
    registerOrganisation(dto: RegisterTenantDto, ip?: string, userAgent?: string): Promise<{
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
    getMe(userId: number, tenantId: number): Promise<{
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
    changePassword(userId: number, dto: ChangePasswordDto, ip?: string): Promise<{
        message: string;
    }>;
    private signToken;
}
