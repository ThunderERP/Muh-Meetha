export declare class CreateSupplierDto {
    name: string;
    code?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
    pan?: string;
    bankName?: string;
    bankAccount?: string;
    bankIfsc?: string;
    notes?: string;
}
declare const UpdateSupplierDto_base: import("@nestjs/common").Type<Partial<CreateSupplierDto>>;
export declare class UpdateSupplierDto extends UpdateSupplierDto_base {
    isActive?: boolean;
}
export declare class SupplierFiltersDto {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
}
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
export declare class SuppliersService {
    private readonly prisma;
    private readonly events;
    constructor(prisma: PrismaService, events: EventEmitter2);
    findAll(tenantId: number, filters: SupplierFiltersDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string | null;
        gstin: string | null;
        pan: string | null;
        state: string | null;
        city: string | null;
        pincode: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        createdBy: number;
        code: string | null;
        bankName: string | null;
        bankAccount: string | null;
        bankIfsc: string | null;
        notes: string | null;
    }>>;
    findOne(id: number, tenantId: number): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string | null;
        gstin: string | null;
        pan: string | null;
        state: string | null;
        city: string | null;
        pincode: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        createdBy: number;
        code: string | null;
        bankName: string | null;
        bankAccount: string | null;
        bankIfsc: string | null;
        notes: string | null;
    }>;
    create(tenantId: number, userId: number, dto: CreateSupplierDto): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string | null;
        gstin: string | null;
        pan: string | null;
        state: string | null;
        city: string | null;
        pincode: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        createdBy: number;
        code: string | null;
        bankName: string | null;
        bankAccount: string | null;
        bankIfsc: string | null;
        notes: string | null;
    }>;
    update(id: number, tenantId: number, userId: number, dto: UpdateSupplierDto): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string | null;
        gstin: string | null;
        pan: string | null;
        state: string | null;
        city: string | null;
        pincode: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        createdBy: number;
        code: string | null;
        bankName: string | null;
        bankAccount: string | null;
        bankIfsc: string | null;
        notes: string | null;
    }>;
    remove(id: number, tenantId: number, userId: number): Promise<{
        message: string;
    }>;
}
import { RequestUser } from '../auth/auth.types';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    findAll(u: RequestUser, filters: SupplierFiltersDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string | null;
        gstin: string | null;
        pan: string | null;
        state: string | null;
        city: string | null;
        pincode: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        createdBy: number;
        code: string | null;
        bankName: string | null;
        bankAccount: string | null;
        bankIfsc: string | null;
        notes: string | null;
    }>>;
    findOne(id: number, u: RequestUser): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string | null;
        gstin: string | null;
        pan: string | null;
        state: string | null;
        city: string | null;
        pincode: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        createdBy: number;
        code: string | null;
        bankName: string | null;
        bankAccount: string | null;
        bankIfsc: string | null;
        notes: string | null;
    }>;
    create(dto: CreateSupplierDto, u: RequestUser): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string | null;
        gstin: string | null;
        pan: string | null;
        state: string | null;
        city: string | null;
        pincode: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        createdBy: number;
        code: string | null;
        bankName: string | null;
        bankAccount: string | null;
        bankIfsc: string | null;
        notes: string | null;
    }>;
    update(id: number, u: RequestUser, dto: UpdateSupplierDto): Promise<{
        id: number;
        name: string;
        isActive: boolean;
        phone: string | null;
        email: string | null;
        gstin: string | null;
        pan: string | null;
        state: string | null;
        city: string | null;
        pincode: string | null;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: number;
        createdBy: number;
        code: string | null;
        bankName: string | null;
        bankAccount: string | null;
        bankIfsc: string | null;
        notes: string | null;
    }>;
    remove(id: number, u: RequestUser): Promise<{
        message: string;
    }>;
}
export declare class SuppliersModule {
}
export {};
