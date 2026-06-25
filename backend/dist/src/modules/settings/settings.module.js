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
exports.SettingsModule = exports.SettingsController = exports.SettingsService = exports.UpdateUserSettingsDto = exports.UpsertCompanySettingDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
class UpsertCompanySettingDto {
}
exports.UpsertCompanySettingDto = UpsertCompanySettingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'inventory' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanySettingDto.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'inv_show_gst' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCompanySettingDto.prototype, "key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], UpsertCompanySettingDto.prototype, "value", void 0);
class UpdateUserSettingsDto {
}
exports.UpdateUserSettingsDto = UpdateUserSettingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserSettingsDto.prototype, "theme", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserSettingsDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserSettingsDto.prototype, "dateFormat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserSettingsDto.prototype, "invShowSku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserSettingsDto.prototype, "invShowGst", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserSettingsDto.prototype, "invShowDiscount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserSettingsDto.prototype, "invShowReorderLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserSettingsDto.prototype, "invShowImage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserSettingsDto.prototype, "invShowMfgDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserSettingsDto.prototype, "invShowExpiryDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserSettingsDto.prototype, "sidebarCollapsed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserSettingsDto.prototype, "notifyLowStock", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserSettingsDto.prototype, "notifyOrderUpdates", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUserSettingsDto.prototype, "notifyPayments", void 0);
let SettingsService = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCompanySettings(tenantId, module) {
        return this.prisma.companySetting.findMany({
            where: { tenantId, ...(module ? { module } : {}) },
            orderBy: [{ module: 'asc' }, { key: 'asc' }],
        });
    }
    async upsertCompanySetting(tenantId, dto) {
        return this.prisma.companySetting.upsert({
            where: {
                tenantId_module_key: { tenantId, module: dto.module, key: dto.key },
            },
            create: { tenantId, module: dto.module, key: dto.key, value: JSON.parse(JSON.stringify(dto.value ?? null)) },
            update: { value: JSON.parse(JSON.stringify(dto.value ?? null)) },
        });
    }
    async bulkUpsertCompanySettings(tenantId, settings) {
        const results = await Promise.all(settings.map((s) => this.upsertCompanySetting(tenantId, s)));
        return { updated: results.length, settings: results };
    }
    async getUserSettings(userId) {
        return this.prisma.userSettings.findUnique({
            where: { userId },
        });
    }
    async updateUserSettings(userId, dto) {
        return this.prisma.userSettings.upsert({
            where: { userId },
            create: { userId, ...dto },
            update: dto,
        });
    }
    async getFeatureFlags(tenantId) {
        return this.prisma.featureFlag.findMany({
            where: { OR: [{ tenantId }, { tenantId: null }] },
            orderBy: { key: 'asc' },
        });
    }
    async isFeatureEnabled(tenantId, key) {
        const tenantFlag = await this.prisma.featureFlag.findFirst({
            where: { tenantId, key },
            select: { enabled: true },
        });
        if (tenantFlag !== null)
            return tenantFlag?.enabled ?? false;
        const globalFlag = await this.prisma.featureFlag.findFirst({
            where: { tenantId: null, key },
            select: { enabled: true },
        });
        return globalFlag?.enabled ?? false;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
const common_2 = require("@nestjs/common");
const swagger_2 = require("@nestjs/swagger");
const auth_decorators_1 = require("../../common/decorators/auth.decorators");
let SettingsController = class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    getCompanySettings(u, module) {
        return this.settingsService.getCompanySettings(u.tenantId, module);
    }
    upsertCompanySetting(u, dto) {
        return this.settingsService.upsertCompanySetting(u.tenantId, dto);
    }
    bulkUpsertCompanySettings(u, dto) {
        return this.settingsService.bulkUpsertCompanySettings(u.tenantId, dto.settings);
    }
    getUserSettings(u) {
        return this.settingsService.getUserSettings(u.id);
    }
    updateUserSettings(u, dto) {
        return this.settingsService.updateUserSettings(u.id, dto);
    }
    getFeatureFlags(u) {
        return this.settingsService.getFeatureFlags(u.tenantId);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_2.Get)('company'),
    (0, swagger_2.ApiOperation)({ summary: 'Get company settings (optionally filtered by module)' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __param(1, (0, common_2.Query)('module')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getCompanySettings", null);
__decorate([
    (0, common_2.Post)('company'),
    (0, auth_decorators_1.Roles)('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER'),
    (0, swagger_2.ApiOperation)({ summary: 'Create or update a company setting' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __param(1, (0, common_2.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpsertCompanySettingDto]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "upsertCompanySetting", null);
__decorate([
    (0, common_2.Post)('company/bulk'),
    (0, auth_decorators_1.Roles)('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER'),
    (0, swagger_2.ApiOperation)({ summary: 'Bulk upsert company settings' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __param(1, (0, common_2.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "bulkUpsertCompanySettings", null);
__decorate([
    (0, common_2.Get)('user'),
    (0, swagger_2.ApiOperation)({ summary: 'Get current user settings / preferences' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getUserSettings", null);
__decorate([
    (0, common_2.Put)('user'),
    (0, swagger_2.ApiOperation)({ summary: 'Update current user settings / preferences' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __param(1, (0, common_2.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpdateUserSettingsDto]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "updateUserSettings", null);
__decorate([
    (0, common_2.Get)('features'),
    (0, swagger_2.ApiOperation)({ summary: 'Get feature flags for this tenant' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getFeatureFlags", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_2.ApiTags)('Settings'),
    (0, swagger_2.ApiBearerAuth)(),
    (0, common_2.UseGuards)(auth_decorators_1.JwtAuthGuard, auth_decorators_1.RolesGuard),
    (0, common_2.Controller)('settings'),
    __metadata("design:paramtypes", [SettingsService])
], SettingsController);
const common_3 = require("@nestjs/common");
let SettingsModule = class SettingsModule {
};
exports.SettingsModule = SettingsModule;
exports.SettingsModule = SettingsModule = __decorate([
    (0, common_3.Module)({
        controllers: [SettingsController],
        providers: [SettingsService],
        exports: [SettingsService],
    })
], SettingsModule);
//# sourceMappingURL=settings.module.js.map