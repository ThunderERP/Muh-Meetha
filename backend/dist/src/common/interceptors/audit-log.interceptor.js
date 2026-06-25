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
var AuditLogInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogInterceptor = exports.AuditLog = exports.AUDIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../modules/prisma/prisma.service");
exports.AUDIT_KEY = 'auditLog';
const AuditLog = (meta) => (target, key, descriptor) => {
    Reflect.defineMetadata(exports.AUDIT_KEY, meta, descriptor.value);
    return descriptor;
};
exports.AuditLog = AuditLog;
let AuditLogInterceptor = AuditLogInterceptor_1 = class AuditLogInterceptor {
    constructor(prisma, reflector) {
        this.prisma = prisma;
        this.reflector = reflector;
        this.logger = new common_1.Logger(AuditLogInterceptor_1.name);
    }
    intercept(ctx, next) {
        const meta = this.reflector.get(exports.AUDIT_KEY, ctx.getHandler());
        if (!meta)
            return next.handle();
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;
        if (!user)
            return next.handle();
        const before = req.body;
        return next.handle().pipe((0, rxjs_1.tap)(async (result) => {
            try {
                const entityId = meta.getEntityId
                    ? meta.getEntityId(before, result)
                    : undefined;
                await this.prisma.auditLog.create({
                    data: {
                        tenantId: user.tenantId,
                        userId: user.id,
                        action: meta.action,
                        module: meta.module,
                        entityType: meta.entityType,
                        entityId: entityId ?? null,
                        before: before ?? undefined,
                        after: result ?? undefined,
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent'],
                        requestId: req.requestId,
                    },
                });
            }
            catch (err) {
                this.logger.error('Audit log write failed', err);
            }
        }));
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = AuditLogInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        core_1.Reflector])
], AuditLogInterceptor);
//# sourceMappingURL=audit-log.interceptor.js.map