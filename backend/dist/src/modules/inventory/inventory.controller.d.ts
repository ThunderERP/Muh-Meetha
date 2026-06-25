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
            count: true | {
                id?: number | undefined;
                tenantId?: number | undefined;
                name?: number | undefined;
                sku?: number | undefined;
                barcode?: number | undefined;
                category?: number | undefined;
                subcategory?: number | undefined;
                brand?: number | undefined;
                unit?: number | undefined;
                hsn?: number | undefined;
                price?: number | undefined;
                purchasePrice?: number | undefined;
                gstPercentage?: number | undefined;
                discountPercentage?: number | undefined;
                description?: number | undefined;
                expiryDate?: number | undefined;
                manufacturingDate?: number | undefined;
                imageUrl?: number | undefined;
                isActive?: number | undefined;
                deletedAt?: number | undefined;
                createdAt?: number | undefined;
                updatedAt?: number | undefined;
                createdBy?: number | undefined;
                updatedBy?: number | undefined;
                _all?: number | undefined;
            } | undefined;
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
