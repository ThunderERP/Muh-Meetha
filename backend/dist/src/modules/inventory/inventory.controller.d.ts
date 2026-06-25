import { RequestUser } from '../auth/auth.types';
import { InventoryService, AdjustStockDto } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getDashboard(u: RequestUser): Promise<{
        totalProducts: number;
        totalCategories: number;
        lowStockCount: number;
        outOfStockCount: number;
        inventoryValue: number;
        totalMovementsToday: number;
        recentMovements: ({
            product: {
                id: number;
                name: string;
                sku: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            createdBy: number;
            notes: string | null;
            productId: number;
            type: import(".prisma/client").$Enums.StockMovementType;
            quantity: number;
            stockBefore: number;
            stockAfter: number;
            referenceType: string;
            referenceId: number | null;
        })[];
        topCategories: {
            category: string;
            count: any;
            value: number;
        }[];
        stockAlerts: ({
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
        })[];
    }>;
    getInventory(productId: number, u: RequestUser): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        product: {
            id: number;
            name: string;
            sku: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        createdBy: number;
        notes: string | null;
        productId: number;
        type: import(".prisma/client").$Enums.StockMovementType;
        quantity: number;
        stockBefore: number;
        stockAfter: number;
        referenceType: string;
        referenceId: number | null;
    }>>;
    adjust(productId: number, u: RequestUser, dto: AdjustStockDto): Promise<{
        inventory: {
            id: number;
            updatedAt: Date;
            availableQty: number;
            reservedQty: number;
            reorderLevel: number;
            productId: number;
        };
        movement: {
            product: {
                id: number;
                name: string;
                sku: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            createdBy: number;
            notes: string | null;
            productId: number;
            type: import(".prisma/client").$Enums.StockMovementType;
            quantity: number;
            stockBefore: number;
            stockAfter: number;
            referenceType: string;
            referenceId: number | null;
        };
    }>;
    getHistory(productId: number, u: RequestUser, page?: number, limit?: number): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        product: {
            id: number;
            name: string;
            sku: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        createdBy: number;
        notes: string | null;
        productId: number;
        type: import(".prisma/client").$Enums.StockMovementType;
        quantity: number;
        stockBefore: number;
        stockAfter: number;
        referenceType: string;
        referenceId: number | null;
    }>>;
}
