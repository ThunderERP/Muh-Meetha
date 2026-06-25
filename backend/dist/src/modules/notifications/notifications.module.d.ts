import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findForUser(tenantId: number, userId: number, page?: number, limit?: number): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        id: number;
        createdAt: Date;
        tenantId: number;
        userId: number;
        status: import(".prisma/client").$Enums.NotificationStatus;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        title: string;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        body: string;
        readAt: Date | null;
        sentAt: Date | null;
    }>>;
    getUnreadCount(tenantId: number, userId: number): Promise<number>;
    markAllRead(tenantId: number, userId: number): Promise<{
        message: string;
    }>;
    markRead(id: number, tenantId: number, userId: number): Promise<{
        id: number;
        createdAt: Date;
        tenantId: number;
        userId: number;
        status: import(".prisma/client").$Enums.NotificationStatus;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        title: string;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        body: string;
        readAt: Date | null;
        sentAt: Date | null;
    } | null>;
    createForTenantAdmins(tenantId: number, title: string, body: string, data?: Record<string, unknown>): Promise<void>;
    onLowStock(payload: {
        tenantId: number;
        productId: number;
        availableQty: number;
        reorderLevel: number;
    }): Promise<void>;
    onOutOfStock(payload: {
        tenantId: number;
        productId: number;
    }): Promise<void>;
    onRegister(payload: {
        userId: number;
        tenantId: number;
    }): Promise<void>;
}
import { RequestUser } from '../auth/auth.types';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(u: RequestUser, page?: number, limit?: number): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        id: number;
        createdAt: Date;
        tenantId: number;
        userId: number;
        status: import(".prisma/client").$Enums.NotificationStatus;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        title: string;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        body: string;
        readAt: Date | null;
        sentAt: Date | null;
    }>>;
    unreadCount(u: RequestUser): Promise<{
        count: number;
    }>;
    markAllRead(u: RequestUser): Promise<{
        message: string;
    }>;
    markRead(id: number, u: RequestUser): Promise<{
        id: number;
        createdAt: Date;
        tenantId: number;
        userId: number;
        status: import(".prisma/client").$Enums.NotificationStatus;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        title: string;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        body: string;
        readAt: Date | null;
        sentAt: Date | null;
    } | null>;
}
export declare class NotificationsModule {
}
