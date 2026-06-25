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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementsModule = exports.StockMovementsController = exports.StockMovementsService = exports.StockMovementFiltersDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class StockMovementFiltersDto {
    constructor() {
        this.page = 1;
        this.limit = 25;
    }
}
exports.StockMovementFiltersDto = StockMovementFiltersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], StockMovementFiltersDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], StockMovementFiltersDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], StockMovementFiltersDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['INWARD', 'OUTWARD', 'ADJUSTMENT', 'RESERVATION', 'RESERVATION_RELEASE'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['INWARD', 'OUTWARD', 'ADJUSTMENT', 'RESERVATION', 'RESERVATION_RELEASE', '']),
    __metadata("design:type", String)
], StockMovementFiltersDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockMovementFiltersDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockMovementFiltersDto.prototype, "to", void 0);
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let StockMovementsService = class StockMovementsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, filters) {
        const { page = 1, limit = 25, productId, type, from, to } = filters;
        const skip = (page - 1) * limit;
        const where = {
            product: { tenantId },
            ...(productId ? { productId } : {}),
            ...(type ? { type } : {}),
            ...(from || to ? {
                createdAt: {
                    ...(from ? { gte: new Date(from) } : {}),
                    ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
                },
            } : {}),
        };
        const [movements, total] = await this.prisma.$transaction([
            this.prisma.stockMovement.findMany({
                where: where,
                include: {
                    product: { select: { id: true, name: true, sku: true, tenantId: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.stockMovement.count({ where: where }),
        ]);
        const userIds = [...new Set(movements.map((m) => m.createdBy))];
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds }, tenantId },
            select: { id: true, name: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        const enriched = movements.map((m) => ({
            ...m,
            createdByUser: userMap.get(m.createdBy) ?? { id: m.createdBy, name: 'Unknown' },
        }));
        return (0, pagination_dto_1.paginate)(enriched, total, page, limit);
    }
};
exports.StockMovementsService = StockMovementsService;
exports.StockMovementsService = StockMovementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockMovementsService);
const common_2 = require("@nestjs/common");
const swagger_2 = require("@nestjs/swagger");
const auth_decorators_1 = require("../../common/decorators/auth.decorators");
let StockMovementsController = class StockMovementsController {
    constructor(stockMovementsService) {
        this.stockMovementsService = stockMovementsService;
    }
    findAll(u, filters) {
        return this.stockMovementsService.findAll(u.tenantId, filters);
    }
};
exports.StockMovementsController = StockMovementsController;
__decorate([
    (0, common_2.Get)(),
    (0, swagger_2.ApiOperation)({ summary: 'List all stock movements with optional filters' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __param(1, (0, common_2.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, StockMovementFiltersDto]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "findAll", null);
exports.StockMovementsController = StockMovementsController = __decorate([
    (0, swagger_2.ApiTags)('Stock Movements'),
    (0, swagger_2.ApiBearerAuth)(),
    (0, common_2.UseGuards)(auth_decorators_1.JwtAuthGuard),
    (0, common_2.Controller)('stock-movements'),
    __metadata("design:paramtypes", [StockMovementsService])
], StockMovementsController);
const common_3 = require("@nestjs/common");
let StockMovementsModule = class StockMovementsModule {
};
exports.StockMovementsModule = StockMovementsModule;
exports.StockMovementsModule = StockMovementsModule = __decorate([
    (0, common_3.Module)({
        controllers: [StockMovementsController],
        providers: [StockMovementsService],
        exports: [StockMovementsService],
    })
], StockMovementsModule);
//# sourceMappingURL=stock-movements.module.js.map