import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductFiltersDto } from './dto/products.dto';
export declare class ProductsService {
    private readonly prisma;
    private readonly events;
    constructor(prisma: PrismaService, events: EventEmitter2);
    findAll(tenantId: number, filters: ProductFiltersDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
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
    findOne(id: number, tenantId: number): Promise<{
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
    }>;
    create(tenantId: number, userId: number, dto: CreateProductDto): Promise<{
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
    }>;
    update(id: number, tenantId: number, userId: number, dto: UpdateProductDto): Promise<{
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
    }>;
    delete(id: number, tenantId: number, userId: number): Promise<{
        message: string;
    }>;
    getCategories(tenantId: number): Promise<string[]>;
    getDashboardStats(tenantId: number): Promise<{
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
    exportCsv(tenantId: number): Promise<string>;
}
