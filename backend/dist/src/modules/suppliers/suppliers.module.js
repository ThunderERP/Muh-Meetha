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
exports.SuppliersModule = exports.SuppliersController = exports.SuppliersService = exports.SupplierFiltersDto = exports.UpdateSupplierDto = exports.CreateSupplierDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateSupplierDto {
}
exports.CreateSupplierDto = CreateSupplierDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "gstin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(15),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "pan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "bankName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "bankAccount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "bankIfsc", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "notes", void 0);
class UpdateSupplierDto extends (0, swagger_1.PartialType)(CreateSupplierDto) {
}
exports.UpdateSupplierDto = UpdateSupplierDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSupplierDto.prototype, "isActive", void 0);
class SupplierFiltersDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.SupplierFiltersDto = SupplierFiltersDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SupplierFiltersDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SupplierFiltersDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SupplierFiltersDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        return value;
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SupplierFiltersDto.prototype, "isActive", void 0);
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let SuppliersService = class SuppliersService {
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
    }
    async findAll(tenantId, filters) {
        const { page = 1, limit = 20, search, isActive } = filters;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            ...(isActive !== undefined ? { isActive } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                ],
            } : {}),
        };
        const [suppliers, total] = await this.prisma.$transaction([
            this.prisma.supplier.findMany({
                where: where,
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.supplier.count({ where: where }),
        ]);
        return (0, pagination_dto_1.paginate)(suppliers, total, page, limit);
    }
    async findOne(id, tenantId) {
        const s = await this.prisma.supplier.findFirst({
            where: { id, tenantId },
        });
        if (!s)
            throw new common_1.NotFoundException(`Supplier #${id} not found`);
        return s;
    }
    async create(tenantId, userId, dto) {
        const supplier = await this.prisma.$transaction(async (tx) => {
            const s = await tx.supplier.create({
                data: { tenantId, ...dto, createdBy: userId },
            });
            await tx.auditLog.create({
                data: {
                    tenantId, userId,
                    action: 'CREATE', module: 'inventory', entityType: 'supplier', entityId: s.id,
                    after: dto,
                },
            });
            return s;
        });
        this.events.emit('inventory.supplier.created', { tenantId, supplierId: supplier.id });
        return supplier;
    }
    async update(id, tenantId, userId, dto) {
        const existing = await this.findOne(id, tenantId);
        const updated = await this.prisma.$transaction(async (tx) => {
            const s = await tx.supplier.update({ where: { id }, data: dto });
            await tx.auditLog.create({
                data: {
                    tenantId, userId,
                    action: 'UPDATE', module: 'inventory', entityType: 'supplier', entityId: id,
                    before: existing, after: dto,
                },
            });
            return s;
        });
        return updated;
    }
    async remove(id, tenantId, userId) {
        const existing = await this.findOne(id, tenantId);
        await this.prisma.$transaction(async (tx) => {
            await tx.supplier.update({ where: { id }, data: { isActive: false } });
            await tx.auditLog.create({
                data: {
                    tenantId, userId,
                    action: 'DELETE', module: 'inventory', entityType: 'supplier', entityId: id,
                    before: existing,
                },
            });
        });
        return { message: 'Supplier removed successfully' };
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], SuppliersService);
const common_2 = require("@nestjs/common");
const swagger_2 = require("@nestjs/swagger");
const auth_decorators_1 = require("../../common/decorators/auth.decorators");
let SuppliersController = class SuppliersController {
    constructor(suppliersService) {
        this.suppliersService = suppliersService;
    }
    findAll(u, filters) {
        return this.suppliersService.findAll(u.tenantId, filters);
    }
    findOne(id, u) {
        return this.suppliersService.findOne(id, u.tenantId);
    }
    create(dto, u) {
        return this.suppliersService.create(u.tenantId, u.id, dto);
    }
    update(id, u, dto) {
        return this.suppliersService.update(id, u.tenantId, u.id, dto);
    }
    remove(id, u) {
        return this.suppliersService.remove(id, u.tenantId, u.id);
    }
};
exports.SuppliersController = SuppliersController;
__decorate([
    (0, common_2.Get)(),
    (0, swagger_2.ApiOperation)({ summary: 'List all suppliers' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __param(1, (0, common_2.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SupplierFiltersDto]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "findAll", null);
__decorate([
    (0, common_2.Get)(':id'),
    (0, swagger_2.ApiOperation)({ summary: 'Get supplier by ID' }),
    __param(0, (0, common_2.Param)('id', common_2.ParseIntPipe)),
    __param(1, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "findOne", null);
__decorate([
    (0, common_2.Post)(),
    (0, auth_decorators_1.Roles)('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'INVENTORY_MANAGER', 'MANAGER'),
    (0, swagger_2.ApiOperation)({ summary: 'Create a supplier' }),
    __param(0, (0, common_2.Body)()),
    __param(1, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateSupplierDto, Object]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "create", null);
__decorate([
    (0, common_2.Put)(':id'),
    (0, auth_decorators_1.Roles)('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'INVENTORY_MANAGER', 'MANAGER'),
    (0, swagger_2.ApiOperation)({ summary: 'Update a supplier' }),
    __param(0, (0, common_2.Param)('id', common_2.ParseIntPipe)),
    __param(1, (0, auth_decorators_1.CurrentUser)()),
    __param(2, (0, common_2.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, UpdateSupplierDto]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "update", null);
__decorate([
    (0, common_2.Delete)(':id'),
    (0, auth_decorators_1.Roles)('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'INVENTORY_MANAGER', 'MANAGER'),
    (0, swagger_2.ApiOperation)({ summary: 'Deactivate / remove a supplier' }),
    __param(0, (0, common_2.Param)('id', common_2.ParseIntPipe)),
    __param(1, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "remove", null);
exports.SuppliersController = SuppliersController = __decorate([
    (0, swagger_2.ApiTags)('Suppliers'),
    (0, swagger_2.ApiBearerAuth)(),
    (0, common_2.UseGuards)(auth_decorators_1.JwtAuthGuard, auth_decorators_1.RolesGuard),
    (0, common_2.Controller)('suppliers'),
    __metadata("design:paramtypes", [SuppliersService])
], SuppliersController);
const common_3 = require("@nestjs/common");
let SuppliersModule = class SuppliersModule {
};
exports.SuppliersModule = SuppliersModule;
exports.SuppliersModule = SuppliersModule = __decorate([
    (0, common_3.Module)({
        controllers: [SuppliersController],
        providers: [SuppliersService],
        exports: [SuppliersService],
    })
], SuppliersModule);
//# sourceMappingURL=suppliers.module.js.map