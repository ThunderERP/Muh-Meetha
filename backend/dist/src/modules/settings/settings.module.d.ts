import { PrismaService } from '../prisma/prisma.service';
export declare class UpsertCompanySettingDto {
    module: string;
    key: string;
    value: unknown;
}
export declare class UpdateUserSettingsDto {
    theme?: string;
    timezone?: string;
    dateFormat?: string;
    invShowSku?: boolean;
    invShowGst?: boolean;
    invShowDiscount?: boolean;
    invShowReorderLevel?: boolean;
    invShowImage?: boolean;
    invShowMfgDate?: boolean;
    invShowExpiryDate?: boolean;
    sidebarCollapsed?: boolean;
    notifyLowStock?: boolean;
    notifyOrderUpdates?: boolean;
    notifyPayments?: boolean;
}
export declare class SettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCompanySettings(tenantId: number, module?: string): Promise<{
        id: number;
        updatedAt: Date;
        tenantId: number;
        module: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        key: string;
    }[]>;
    upsertCompanySetting(tenantId: number, dto: UpsertCompanySettingDto): Promise<{
        id: number;
        updatedAt: Date;
        tenantId: number;
        module: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        key: string;
    }>;
    bulkUpsertCompanySettings(tenantId: number, settings: UpsertCompanySettingDto[]): Promise<{
        updated: number;
        settings: {
            id: number;
            updatedAt: Date;
            tenantId: number;
            module: string;
            value: import("@prisma/client/runtime/library").JsonValue;
            key: string;
        }[];
    }>;
    getUserSettings(userId: number): Promise<{
        id: number;
        timezone: string;
        currency: string;
        updatedAt: Date;
        userId: number;
        theme: string;
        language: string;
        dateFormat: string;
        notifyOrderUpdates: boolean;
        notifyLowStock: boolean;
        notifyPayments: boolean;
        notifyReturns: boolean;
        sidebarCollapsed: boolean;
        invShowSku: boolean;
        invShowGst: boolean;
        invShowDiscount: boolean;
        invShowReorderLevel: boolean;
        invShowImage: boolean;
        invShowMfgDate: boolean;
        invShowExpiryDate: boolean;
    } | null>;
    updateUserSettings(userId: number, dto: UpdateUserSettingsDto): Promise<{
        id: number;
        timezone: string;
        currency: string;
        updatedAt: Date;
        userId: number;
        theme: string;
        language: string;
        dateFormat: string;
        notifyOrderUpdates: boolean;
        notifyLowStock: boolean;
        notifyPayments: boolean;
        notifyReturns: boolean;
        sidebarCollapsed: boolean;
        invShowSku: boolean;
        invShowGst: boolean;
        invShowDiscount: boolean;
        invShowReorderLevel: boolean;
        invShowImage: boolean;
        invShowMfgDate: boolean;
        invShowExpiryDate: boolean;
    }>;
    getFeatureFlags(tenantId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        key: string;
        enabled: boolean;
    }[]>;
    isFeatureEnabled(tenantId: number, key: string): Promise<boolean>;
}
import { RequestUser } from '../auth/auth.types';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getCompanySettings(u: RequestUser, module?: string): Promise<{
        id: number;
        updatedAt: Date;
        tenantId: number;
        module: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        key: string;
    }[]>;
    upsertCompanySetting(u: RequestUser, dto: UpsertCompanySettingDto): Promise<{
        id: number;
        updatedAt: Date;
        tenantId: number;
        module: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        key: string;
    }>;
    bulkUpsertCompanySettings(u: RequestUser, dto: {
        settings: UpsertCompanySettingDto[];
    }): Promise<{
        updated: number;
        settings: {
            id: number;
            updatedAt: Date;
            tenantId: number;
            module: string;
            value: import("@prisma/client/runtime/library").JsonValue;
            key: string;
        }[];
    }>;
    getUserSettings(u: RequestUser): Promise<{
        id: number;
        timezone: string;
        currency: string;
        updatedAt: Date;
        userId: number;
        theme: string;
        language: string;
        dateFormat: string;
        notifyOrderUpdates: boolean;
        notifyLowStock: boolean;
        notifyPayments: boolean;
        notifyReturns: boolean;
        sidebarCollapsed: boolean;
        invShowSku: boolean;
        invShowGst: boolean;
        invShowDiscount: boolean;
        invShowReorderLevel: boolean;
        invShowImage: boolean;
        invShowMfgDate: boolean;
        invShowExpiryDate: boolean;
    } | null>;
    updateUserSettings(u: RequestUser, dto: UpdateUserSettingsDto): Promise<{
        id: number;
        timezone: string;
        currency: string;
        updatedAt: Date;
        userId: number;
        theme: string;
        language: string;
        dateFormat: string;
        notifyOrderUpdates: boolean;
        notifyLowStock: boolean;
        notifyPayments: boolean;
        notifyReturns: boolean;
        sidebarCollapsed: boolean;
        invShowSku: boolean;
        invShowGst: boolean;
        invShowDiscount: boolean;
        invShowReorderLevel: boolean;
        invShowImage: boolean;
        invShowMfgDate: boolean;
        invShowExpiryDate: boolean;
    }>;
    getFeatureFlags(u: RequestUser): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        description: string | null;
        key: string;
        enabled: boolean;
    }[]>;
}
export declare class SettingsModule {
}
