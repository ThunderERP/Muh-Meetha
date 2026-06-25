export declare class StockMovementFiltersDto {
    page?: number;
    limit?: number;
    productId?: number;
    type?: string;
    from?: string;
    to?: string;
}
import { PrismaService } from '../prisma/prisma.service';
export declare class StockMovementsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: number, filters: StockMovementFiltersDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        createdByUser: {
            id: number;
            name: string;
        };
        product: {
            id: number;
            name: string;
            tenantId: number;
            sku: string | null;
        };
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
import { RequestUser } from '../auth/auth.types';
export declare class StockMovementsController {
    private readonly stockMovementsService;
    constructor(stockMovementsService: StockMovementsService);
    findAll(u: RequestUser, filters: StockMovementFiltersDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        createdByUser: {
            id: number;
            name: string;
        };
        product: {
            id: number;
            name: string;
            tenantId: number;
            sku: string | null;
        };
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
export declare class StockMovementsModule {
}
