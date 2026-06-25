"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const PRODUCT_SELECT = {
    id: true, tenantId: true, name: true, sku: true, barcode: true,
    category: true, subcategory: true, brand: true, unit: true, hsn: true,
    price: true, purchasePrice: true, gstPercentage: true, discountPercentage: true,
    description: true, expiryDate: true, manufacturingDate: true,
    imageUrl: true, isActive: true, createdAt: true, updatedAt: true, createdBy: true,
    inventory: true,
};
let ProductsService = class ProductsService {
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
    }
    async findAll(tenantId, filters) {
        const { page = 1, limit = 20, search, category, status, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            deletedAt: null,
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                    { category: { contains: search, mode: 'insensitive' } },
                ],
            } : {}),
            ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
            ...(status === 'inactive' ? { isActive: false } : {}),
            ...(status === 'active' ? { isActive: true } : {}),
            ...(status === 'out_of_stock' ? { inventory: { availableQty: { equals: 0 } } } : {}),
        };
        const [rawProducts, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where: where,
                skip: status === 'low_stock' ? 0 : skip,
                take: status === 'low_stock' ? 10000 : limit,
                include: { inventory: true },
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.product.count({ where: where }),
        ]);
        let products = rawProducts;
        let adjustedTotal = total;
        if (status === 'low_stock') {
            products = rawProducts.filter((p) => (p.inventory?.availableQty ?? 0) > 0 &&
                (p.inventory?.availableQty ?? 0) <= (p.inventory?.reorderLevel ?? 10));
            adjustedTotal = products.length;
            products = products.slice(skip, skip + limit);
        }
        return (0, pagination_dto_1.paginate)(products, adjustedTotal, page, limit);
    }
    async findOne(id, tenantId) {
        const p = await this.prisma.product.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: { inventory: true },
        });
        if (!p)
            throw new common_1.NotFoundException(`Product #${id} not found`);
        return p;
    }
    async create(tenantId, userId, dto) {
        if (dto.sku) {
            const exists = await this.prisma.product.findFirst({
                where: { tenantId, sku: dto.sku, deletedAt: null },
                select: { id: true },
            });
            if (exists)
                throw new common_1.ConflictException(`SKU "${dto.sku}" already exists`);
        }
        const product = await this.prisma.withTenantContext(tenantId, userId, async (tx) => {
            const p = await tx.product.create({
                data: {
                    tenantId,
                    name: dto.name,
                    sku: dto.sku,
                    barcode: dto.barcode,
                    category: dto.category,
                    subcategory: dto.subcategory,
                    brand: dto.brand,
                    unit: dto.unit || 'Piece',
                    hsn: dto.hsn,
                    price: dto.price,
                    purchasePrice: dto.purchasePrice,
                    gstPercentage: dto.gstPercentage ?? 18,
                    discountPercentage: dto.discountPercentage ?? 0,
                    description: dto.description,
                    expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
                    manufacturingDate: dto.manufacturingDate ? new Date(dto.manufacturingDate) : undefined,
                    imageUrl: dto.imageUrl,
                    createdBy: userId,
                    updatedBy: userId,
                },
                include: { inventory: true },
            });
            await tx.inventory.create({
                data: {
                    productId: p.id,
                    availableQty: 0,
                    reservedQty: 0,
                    reorderLevel: dto.reorderLevel ?? 10,
                },
            });
            await tx.auditLog.create({
                data: {
                    tenantId,
                    userId,
                    action: 'CREATE',
                    module: 'inventory',
                    entityType: 'product',
                    entityId: p.id,
                    after: dto,
                },
            });
            return p;
        });
        this.events.emit('inventory.product.created', { tenantId, productId: product.id, userId });
        return this.findOne(product.id, tenantId);
    }
    async update(id, tenantId, userId, dto) {
        const existing = await this.findOne(id, tenantId);
        if (dto.sku && dto.sku !== existing.sku) {
            const conflict = await this.prisma.product.findFirst({
                where: { tenantId, sku: dto.sku, deletedAt: null, id: { not: id } },
                select: { id: true },
            });
            if (conflict)
                throw new common_1.ConflictException(`SKU "${dto.sku}" already exists`);
        }
        const updated = await this.prisma.withTenantContext(tenantId, userId, async (tx) => {
            const p = await tx.product.update({
                where: { id },
                data: {
                    ...dto,
                    expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
                    manufacturingDate: dto.manufacturingDate ? new Date(dto.manufacturingDate) : undefined,
                    updatedBy: userId,
                },
                include: { inventory: true },
            });
            if (dto.reorderLevel !== undefined) {
                await tx.inventory.update({
                    where: { productId: id },
                    data: { reorderLevel: dto.reorderLevel },
                });
            }
            await tx.auditLog.create({
                data: {
                    tenantId,
                    userId,
                    action: 'UPDATE',
                    module: 'inventory',
                    entityType: 'product',
                    entityId: id,
                    before: existing,
                    after: dto,
                },
            });
            return p;
        });
        this.events.emit('inventory.product.updated', { tenantId, productId: id, userId });
        return updated;
    }
    async delete(id, tenantId, userId) {
        const existing = await this.findOne(id, tenantId);
        const stock = existing.inventory?.availableQty ?? 0;
        if (stock > 0) {
            throw new common_1.BadRequestException(`Cannot delete product with ${stock} units in stock. Clear stock first.`);
        }
        await this.prisma.withTenantContext(tenantId, userId, async (tx) => {
            await tx.product.update({
                where: { id },
                data: { deletedAt: new Date(), isActive: false, updatedBy: userId },
            });
            await tx.auditLog.create({
                data: {
                    tenantId, userId,
                    action: 'DELETE', module: 'inventory', entityType: 'product', entityId: id,
                    before: existing,
                },
            });
        });
        this.events.emit('inventory.product.deleted', { tenantId, productId: id, userId });
        return { message: 'Product deleted successfully' };
    }
    async getCategories(tenantId) {
        const rows = await this.prisma.product.findMany({
            where: { tenantId, deletedAt: null, category: { not: null } },
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' },
        });
        return rows.map((r) => r.category).filter(Boolean);
    }
    async getDashboardStats(tenantId) {
        const [totalProducts, outOfStock, categories] = await this.prisma.$transaction([
            this.prisma.product.count({ where: { tenantId, deletedAt: null, isActive: true } }),
            this.prisma.inventory.count({
                where: {
                    product: { tenantId, deletedAt: null, isActive: true },
                    availableQty: 0,
                },
            }),
            this.prisma.product.groupBy({
                by: ['category'],
                where: { tenantId, deletedAt: null, isActive: true },
                _count: { _all: true },
                orderBy: { _count: { category: 'desc' } },
            }),
        ]);
        const allInventory = await this.prisma.product.findMany({
            where: { tenantId, deletedAt: null, isActive: true },
            include: { inventory: true },
        });
        let inventoryValue = 0;
        let actualLowStock = 0;
        const stockAlerts = [];
        for (const p of allInventory) {
            const qty = p.inventory?.availableQty ?? 0;
            const reorder = p.inventory?.reorderLevel ?? 10;
            inventoryValue += qty * Number(p.price);
            if (qty > 0 && qty <= reorder) {
                actualLowStock++;
                stockAlerts.push(p);
            }
        }
        const recentMovements = await this.prisma.stockMovement.findMany({
            where: { product: { tenantId } },
            include: { product: { select: { id: true, name: true, sku: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMovements = await this.prisma.stockMovement.count({
            where: { product: { tenantId }, createdAt: { gte: today } },
        });
        return {
            totalProducts,
            totalCategories: categories.length,
            lowStockCount: actualLowStock,
            outOfStockCount: outOfStock,
            inventoryValue: Math.round(inventoryValue * 100) / 100,
            totalMovementsToday: todayMovements,
            recentMovements,
            topCategories: categories.map((c) => ({
                category: c.category ?? 'Uncategorised',
                count: c._count?._all ?? 0,
                value: 0,
            })),
            stockAlerts: stockAlerts.slice(0, 20),
        };
    }
    async exportCsv(tenantId) {
        const products = await this.prisma.product.findMany({
            where: { tenantId, deletedAt: null },
            include: { inventory: true },
            orderBy: { name: 'asc' },
        });
        const header = [
            'Name', 'SKU', 'Barcode', 'Category', 'Unit', 'Selling Price (₹)',
            'Purchase Price (₹)', 'GST %', 'Discount %', 'Stock', 'Reorder Level',
            'HSN', 'Description', 'Status',
        ].join(',');
        const rows = products.map((p) => [
            `"${(p.name || '').replace(/"/g, '""')}"`,
            p.sku || '',
            p.barcode || '',
            p.category || '',
            p.unit,
            Number(p.price).toFixed(2),
            p.purchasePrice ? Number(p.purchasePrice).toFixed(2) : '',
            Number(p.gstPercentage),
            Number(p.discountPercentage),
            p.inventory?.availableQty ?? 0,
            p.inventory?.reorderLevel ?? 10,
            p.hsn || '',
            `"${(p.description || '').replace(/"/g, '""')}"`,
            p.isActive ? 'Active' : 'Inactive',
        ].join(','));
        return [header, ...rows].join('\n');
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], ProductsService);
//# sourceMappingURL=products.service.js.map