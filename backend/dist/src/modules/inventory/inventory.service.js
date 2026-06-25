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
exports.InventoryService = exports.AdjustStockDto = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const products_service_1 = require("../products/products.service");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class AdjustStockDto {
}
exports.AdjustStockDto = AdjustStockDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['INWARD', 'OUTWARD', 'ADJUSTMENT', 'RESERVATION', 'RESERVATION_RELEASE'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['INWARD', 'OUTWARD', 'ADJUSTMENT', 'RESERVATION', 'RESERVATION_RELEASE']),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Positive integer for INWARD/OUTWARD/RESERVATION. Signed integer for ADJUSTMENT.' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AdjustStockDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "referenceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AdjustStockDto.prototype, "referenceId", void 0);
let InventoryService = class InventoryService {
    constructor(prisma, products, events) {
        this.prisma = prisma;
        this.products = products;
        this.events = events;
    }
    async adjust(productId, tenantId, userId, dto) {
        const product = await this.products.findOne(productId, tenantId);
        const inv = product.inventory;
        if (!inv)
            throw new common_1.NotFoundException('Inventory record not found for this product');
        const currentQty = inv.availableQty;
        const currentReserved = inv.reservedQty;
        let newQty = currentQty;
        let newReserved = currentReserved;
        switch (dto.type) {
            case 'INWARD':
                if (dto.quantity <= 0) {
                    throw new common_1.BadRequestException('INWARD quantity must be a positive number');
                }
                newQty = currentQty + dto.quantity;
                break;
            case 'OUTWARD':
                if (dto.quantity <= 0) {
                    throw new common_1.BadRequestException('OUTWARD quantity must be a positive number');
                }
                if (dto.quantity > currentQty) {
                    throw new common_1.BadRequestException(`Insufficient stock. Available: ${currentQty}, Requested: ${dto.quantity}`);
                }
                newQty = currentQty - dto.quantity;
                break;
            case 'ADJUSTMENT':
                newQty = currentQty + dto.quantity;
                if (newQty < 0) {
                    throw new common_1.BadRequestException(`Adjustment would result in negative stock (current: ${currentQty}, delta: ${dto.quantity})`);
                }
                break;
            case 'RESERVATION':
                if (dto.quantity <= 0) {
                    throw new common_1.BadRequestException('RESERVATION quantity must be a positive number');
                }
                if (dto.quantity > currentQty) {
                    throw new common_1.BadRequestException(`Cannot reserve more than available stock. Available: ${currentQty}, Requested: ${dto.quantity}`);
                }
                newReserved = currentReserved + dto.quantity;
                break;
            case 'RESERVATION_RELEASE':
                if (dto.quantity <= 0) {
                    throw new common_1.BadRequestException('RESERVATION_RELEASE quantity must be a positive number');
                }
                newReserved = Math.max(0, currentReserved - dto.quantity);
                break;
            default:
                throw new common_1.BadRequestException(`Unknown movement type: ${dto.type}`);
        }
        const isAvailableChange = ['INWARD', 'OUTWARD', 'ADJUSTMENT'].includes(dto.type);
        const isReservationChange = ['RESERVATION', 'RESERVATION_RELEASE'].includes(dto.type);
        const result = await this.prisma.withTenantContext(tenantId, userId, async (tx) => {
            const updatedInv = await tx.inventory.update({
                where: { productId },
                data: {
                    ...(isAvailableChange ? { availableQty: newQty } : {}),
                    ...(isReservationChange ? { reservedQty: newReserved } : {}),
                },
            });
            const movement = await tx.stockMovement.create({
                data: {
                    productId,
                    type: dto.type,
                    quantity: Math.abs(dto.quantity),
                    stockBefore: currentQty,
                    stockAfter: isAvailableChange ? newQty : currentQty,
                    referenceType: dto.referenceType || 'MANUAL',
                    referenceId: dto.referenceId,
                    notes: dto.notes,
                    createdBy: userId,
                },
                include: {
                    product: { select: { id: true, name: true, sku: true } },
                },
            });
            await tx.auditLog.create({
                data: {
                    tenantId,
                    userId,
                    action: 'UPDATE',
                    module: 'inventory',
                    entityType: 'inventory',
                    entityId: productId,
                    before: {
                        availableQty: currentQty,
                        reservedQty: currentReserved,
                    },
                    after: {
                        availableQty: isAvailableChange ? newQty : currentQty,
                        reservedQty: isReservationChange ? newReserved : currentReserved,
                        type: dto.type,
                        quantity: dto.quantity,
                    },
                },
            });
            return { inventory: updatedInv, movement };
        });
        const effectiveQty = isAvailableChange ? newQty : currentQty;
        if (effectiveQty <= inv.reorderLevel && effectiveQty > 0) {
            this.events.emit('inventory.low_stock', {
                tenantId,
                productId,
                availableQty: effectiveQty,
                reorderLevel: inv.reorderLevel,
            });
        }
        if (effectiveQty === 0 && isAvailableChange) {
            this.events.emit('inventory.out_of_stock', { tenantId, productId });
        }
        this.events.emit('inventory.stock.adjusted', {
            tenantId,
            productId,
            userId,
            type: dto.type,
        });
        return result;
    }
    async getHistory(productId, tenantId, page = 1, limit = 20) {
        await this.products.findOne(productId, tenantId);
        const skip = (page - 1) * limit;
        const [movements, total] = await this.prisma.$transaction([
            this.prisma.stockMovement.findMany({
                where: { productId },
                include: { product: { select: { id: true, name: true, sku: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.stockMovement.count({ where: { productId } }),
        ]);
        return (0, pagination_dto_1.paginate)(movements, total, page, limit);
    }
    async getReorderAlerts(tenantId, page = 1, limit = 25) {
        const allProducts = await this.prisma.product.findMany({
            where: { tenantId, deletedAt: null, isActive: true },
            include: { inventory: true },
            orderBy: { name: 'asc' },
        });
        const alerts = allProducts.filter((p) => {
            const qty = p.inventory?.availableQty ?? 0;
            const reorder = p.inventory?.reorderLevel ?? 10;
            return qty <= reorder;
        });
        const total = alerts.length;
        const start = (page - 1) * limit;
        const paged = alerts.slice(start, start + limit);
        return (0, pagination_dto_1.paginate)(paged, total, page, limit);
    }
    async getDashboard(tenantId) {
        return this.products.getDashboardStats(tenantId);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        products_service_1.ProductsService,
        event_emitter_1.EventEmitter2])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map