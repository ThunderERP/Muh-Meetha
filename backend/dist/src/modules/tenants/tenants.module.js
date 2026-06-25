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
exports.TenantsModule = exports.TenantsController = exports.TenantsService = exports.UpdateTenantDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateTenantDto {
}
exports.UpdateTenantDto = UpdateTenantDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "legalName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "website", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "gstin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(15),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "pan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(25),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "cin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "industry", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "businessType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], UpdateTenantDto.prototype, "currency", void 0);
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const TENANT_SELECT = {
    id: true, slug: true, name: true, legalName: true, plan: true,
    isActive: true, maxUsers: true, storageQuotaMb: true,
    phone: true, email: true, website: true, gstin: true, pan: true, cin: true,
    industry: true, businessType: true, country: true, state: true,
    city: true, pincode: true, address: true, timezone: true,
    currency: true, fiscalYearStart: true, isEmailVerified: true,
    createdAt: true, updatedAt: true,
};
let TenantsService = class TenantsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOne(tenantId) {
        return this.prisma.tenant.findUniqueOrThrow({
            where: { id: tenantId },
            select: TENANT_SELECT,
        });
    }
    async update(tenantId, userId, role, dto) {
        if (!['DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER'].includes(role)) {
            throw new common_1.ForbiddenException('Only admins can update company details');
        }
        const updated = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: dto,
            select: TENANT_SELECT,
        });
        await this.prisma.auditLog.create({
            data: {
                tenantId,
                userId,
                action: 'UPDATE',
                module: 'company',
                entityType: 'tenant',
                entityId: tenantId,
                after: dto,
            },
        });
        return updated;
    }
    async getModules(tenantId) {
        return this.prisma.companyModule.findMany({
            where: { tenantId },
            orderBy: { moduleKey: 'asc' },
        });
    }
    async getSubscription(tenantId) {
        return this.prisma.subscription.findFirst({
            where: { tenantId, isActive: true },
            orderBy: { startsAt: 'desc' },
        });
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantsService);
const common_2 = require("@nestjs/common");
const swagger_2 = require("@nestjs/swagger");
const auth_decorators_1 = require("../../common/decorators/auth.decorators");
let TenantsController = class TenantsController {
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
    }
    getCompany(user) {
        return this.tenantsService.findOne(user.tenantId);
    }
    updateCompany(user, dto) {
        return this.tenantsService.update(user.tenantId, user.id, user.role, dto);
    }
    getModules(user) {
        return this.tenantsService.getModules(user.tenantId);
    }
    getSubscription(user) {
        return this.tenantsService.getSubscription(user.tenantId);
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, common_2.Get)(),
    (0, swagger_2.ApiOperation)({ summary: 'Get company profile' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "getCompany", null);
__decorate([
    (0, common_2.Put)(),
    (0, swagger_2.ApiOperation)({ summary: 'Update company profile' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __param(1, (0, common_2.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpdateTenantDto]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "updateCompany", null);
__decorate([
    (0, common_2.Get)('modules'),
    (0, swagger_2.ApiOperation)({ summary: 'Get activated modules for this company' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "getModules", null);
__decorate([
    (0, common_2.Get)('subscription'),
    (0, swagger_2.ApiOperation)({ summary: 'Get current subscription details' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "getSubscription", null);
exports.TenantsController = TenantsController = __decorate([
    (0, swagger_2.ApiTags)('Company'),
    (0, swagger_2.ApiBearerAuth)(),
    (0, common_2.UseGuards)(auth_decorators_1.JwtAuthGuard),
    (0, common_2.Controller)('company'),
    __metadata("design:paramtypes", [TenantsService])
], TenantsController);
const common_3 = require("@nestjs/common");
let TenantsModule = class TenantsModule {
};
exports.TenantsModule = TenantsModule;
exports.TenantsModule = TenantsModule = __decorate([
    (0, common_3.Module)({
        controllers: [TenantsController],
        providers: [TenantsService],
        exports: [TenantsService],
    })
], TenantsModule);
//# sourceMappingURL=tenants.module.js.map