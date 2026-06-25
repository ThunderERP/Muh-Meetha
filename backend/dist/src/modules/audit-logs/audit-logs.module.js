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
exports.AuditLogsModule = exports.AuditLogsController = exports.AuditLogsService = exports.AuditLogFiltersDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
class AuditLogFiltersDto {
    constructor() {
        this.page = 1;
        this.limit = 30;
    }
}
exports.AuditLogFiltersDto = AuditLogFiltersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AuditLogFiltersDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AuditLogFiltersDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogFiltersDto.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogFiltersDto.prototype, "entity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogFiltersDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogFiltersDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogFiltersDto.prototype, "to", void 0);
let AuditLogsService = class AuditLogsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, filters) {
        const { page = 1, limit = 30, module, entity, action, from, to } = filters;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            ...(module ? { module: { contains: module, mode: 'insensitive' } } : {}),
            ...(entity ? { entityType: { contains: entity, mode: 'insensitive' } } : {}),
            ...(action ? { action } : {}),
            ...(from || to ? {
                createdAt: {
                    ...(from ? { gte: new Date(from) } : {}),
                    ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
                },
            } : {}),
        };
        const [logs, total] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                where: where,
                include: { user: { select: { id: true, name: true, email: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.auditLog.count({ where: where }),
        ]);
        return (0, pagination_dto_1.paginate)(logs, total, page, limit);
    }
};
exports.AuditLogsService = AuditLogsService;
exports.AuditLogsService = AuditLogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogsService);
const common_2 = require("@nestjs/common");
const swagger_2 = require("@nestjs/swagger");
const auth_decorators_1 = require("../../common/decorators/auth.decorators");
let AuditLogsController = class AuditLogsController {
    constructor(auditLogsService) {
        this.auditLogsService = auditLogsService;
    }
    findAll(u, filters) {
        return this.auditLogsService.findAll(u.tenantId, filters);
    }
};
exports.AuditLogsController = AuditLogsController;
__decorate([
    (0, common_2.Get)(),
    (0, auth_decorators_1.Roles)('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'FINANCE_MANAGER'),
    (0, swagger_2.ApiOperation)({ summary: 'List audit logs for the tenant' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __param(1, (0, common_2.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AuditLogFiltersDto]),
    __metadata("design:returntype", void 0)
], AuditLogsController.prototype, "findAll", null);
exports.AuditLogsController = AuditLogsController = __decorate([
    (0, swagger_2.ApiTags)('Audit Logs'),
    (0, swagger_2.ApiBearerAuth)(),
    (0, common_2.UseGuards)(auth_decorators_1.JwtAuthGuard, auth_decorators_1.RolesGuard),
    (0, common_2.Controller)('audit-logs'),
    __metadata("design:paramtypes", [AuditLogsService])
], AuditLogsController);
const common_3 = require("@nestjs/common");
let AuditLogsModule = class AuditLogsModule {
};
exports.AuditLogsModule = AuditLogsModule;
exports.AuditLogsModule = AuditLogsModule = __decorate([
    (0, common_3.Module)({
        controllers: [AuditLogsController],
        providers: [AuditLogsService],
        exports: [AuditLogsService],
    })
], AuditLogsModule);
//# sourceMappingURL=audit-logs.module.js.map