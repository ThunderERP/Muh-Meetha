import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
export declare class AdjustStockDto {
    type: string;
    quantity: number;
    notes?: string;
    referenceType?: string;
    referenceId?: number;
}
export declare class InventoryService {
    private readonly prisma;
    private readonly products;
    private readonly events;
    constructor(prisma: PrismaService, products: ProductsService, events: EventEmitter2);
    adjust(productId: number, tenantId: number, userId: number, dto: AdjustStockDto): Promise<{
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
    getHistory(productId: number, tenantId: number, page?: number, limit?: number): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
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
    getReorderAlerts(tenantId: number, page?: number, limit?: number): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
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
    getDashboard(tenantId: number): Promise<{
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
}
