import { RequestUser } from '../auth/auth.types';
import { InventoryService } from './inventory.service';
export declare class ReorderAlertsController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getReorderAlerts(u: RequestUser, page?: number, limit?: number): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        inventory: {
            id: number;
            updatedAt: Date;
            availableQty: number;
            reservedQty: number;
            reorderLevel: number;
            productId: number;
        } | null;
    } & {
        id: number;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        createdBy: number;
        sku: string | null;
        barcode: string | null;
        category: string | null;
        subcategory: string | null;
        brand: string | null;
        unit: string;
        hsn: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
        gstPercentage: import("@prisma/client/runtime/library").Decimal;
        discountPercentage: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        expiryDate: Date | null;
        manufacturingDate: Date | null;
        imageUrl: string | null;
        deletedAt: Date | null;
        updatedBy: number | null;
    }>>;
}
