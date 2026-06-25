import { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductFiltersDto } from './dto/products.dto';
import { RequestUser } from '../auth/auth.types';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(u: RequestUser, filters: ProductFiltersDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
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
    getCategories(u: RequestUser): Promise<string[]>;
    exportCsv(u: RequestUser, res: Response): Promise<void>;
    findOne(id: number, u: RequestUser): Promise<{
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
    create(dto: CreateProductDto, u: RequestUser): Promise<{
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
    update(id: number, u: RequestUser, dto: UpdateProductDto): Promise<{
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
    delete(id: number, u: RequestUser): Promise<{
        message: string;
    }>;
}
export declare class ProductsModule {
}
