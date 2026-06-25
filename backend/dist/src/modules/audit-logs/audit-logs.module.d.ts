import { PrismaService } from '../prisma/prisma.service';
export declare class AuditLogFiltersDto {
    page?: number;
    limit?: number;
    module?: string;
    entity?: string;
    action?: string;
    from?: string;
    to?: string;
}
export declare class AuditLogsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: number, filters: AuditLogFiltersDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        user: {
            id: number;
            name: string;
            email: string;
        };
    } & {
        id: number;
        createdAt: Date;
        tenantId: number;
        userId: number;
        action: import(".prisma/client").$Enums.AuditAction;
        module: string;
        entityType: string;
        entityId: number | null;
        before: import("@prisma/client/runtime/library").JsonValue | null;
        after: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        requestId: string | null;
    }>>;
}
import { RequestUser } from '../auth/auth.types';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    findAll(u: RequestUser, filters: AuditLogFiltersDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        user: {
            id: number;
            name: string;
            email: string;
        };
    } & {
        id: number;
        createdAt: Date;
        tenantId: number;
        userId: number;
        action: import(".prisma/client").$Enums.AuditAction;
        module: string;
        entityType: string;
        entityId: number | null;
        before: import("@prisma/client/runtime/library").JsonValue | null;
        after: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        requestId: string | null;
    }>>;
}
export declare class AuditLogsModule {
}
