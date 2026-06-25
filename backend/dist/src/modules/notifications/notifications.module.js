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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = exports.NotificationsController = exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async findForUser(tenantId, userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await this.prisma.$transaction([
            this.prisma.notification.findMany({
                where: { tenantId, userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where: { tenantId, userId } }),
        ]);
        return (0, pagination_dto_1.paginate)(notifications, total, page, limit);
    }
    async getUnreadCount(tenantId, userId) {
        return this.prisma.notification.count({
            where: { tenantId, userId, readAt: null },
        });
    }
    async markAllRead(tenantId, userId) {
        await this.prisma.notification.updateMany({
            where: { tenantId, userId, readAt: null },
            data: { readAt: new Date(), status: 'READ' },
        });
        return { message: 'All notifications marked as read' };
    }
    async markRead(id, tenantId, userId) {
        const notification = await this.prisma.notification.findFirst({
            where: { id, tenantId, userId },
            select: { id: true, readAt: true },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        if (notification.readAt) {
            return this.prisma.notification.findUnique({ where: { id } });
        }
        return this.prisma.notification.update({
            where: { id },
            data: { readAt: new Date(), status: 'READ' },
        });
    }
    async createForTenantAdmins(tenantId, title, body, data) {
        const admins = await this.prisma.user.findMany({
            where: {
                tenantId,
                isActive: true,
                role: { in: ['DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'INVENTORY_MANAGER'] },
            },
            select: { id: true },
        });
        if (admins.length === 0)
            return;
        await this.prisma.notification.createMany({
            data: admins.map((a) => ({
                tenantId,
                userId: a.id,
                channel: 'IN_APP',
                status: 'DELIVERED',
                title,
                body,
                data: data ? JSON.parse(JSON.stringify(data)) : undefined,
                sentAt: new Date(),
            })),
        });
    }
    async onLowStock(payload) {
        try {
            const product = await this.prisma.product.findUnique({
                where: { id: payload.productId },
                select: { name: true, sku: true },
            });
            if (!product)
                return;
            await this.createForTenantAdmins(payload.tenantId, `⚠️ Low Stock Alert: ${product.name}`, `${product.name}${product.sku ? ` (${product.sku})` : ''} has only ${payload.availableQty} units left (reorder level: ${payload.reorderLevel}).`, { type: 'LOW_STOCK', productId: payload.productId, availableQty: payload.availableQty });
        }
        catch (err) {
            this.logger.error('Failed to create low-stock notification', err);
        }
    }
    async onOutOfStock(payload) {
        try {
            const product = await this.prisma.product.findUnique({
                where: { id: payload.productId },
                select: { name: true, sku: true },
            });
            if (!product)
                return;
            await this.createForTenantAdmins(payload.tenantId, `🚨 Out of Stock: ${product.name}`, `${product.name}${product.sku ? ` (${product.sku})` : ''} is now completely out of stock. Immediate restocking required.`, { type: 'OUT_OF_STOCK', productId: payload.productId });
        }
        catch (err) {
            this.logger.error('Failed to create out-of-stock notification', err);
        }
    }
    async onRegister(payload) {
        try {
            await this.prisma.notification.create({
                data: {
                    tenantId: payload.tenantId,
                    userId: payload.userId,
                    channel: 'IN_APP',
                    status: 'DELIVERED',
                    title: '🎉 Welcome to ThunderERP!',
                    body: 'Your workspace is ready. Start by adding your first product in the Inventory module.',
                    data: JSON.parse(JSON.stringify({ type: 'WELCOME', url: '/inventory/products' })),
                    sentAt: new Date(),
                },
            });
        }
        catch (err) {
            this.logger.error('Failed to create welcome notification', err);
        }
    }
};
exports.NotificationsService = NotificationsService;
__decorate([
    (0, event_emitter_1.OnEvent)('inventory.low_stock'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onLowStock", null);
__decorate([
    (0, event_emitter_1.OnEvent)('inventory.out_of_stock'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onOutOfStock", null);
__decorate([
    (0, event_emitter_1.OnEvent)('auth.register'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "onRegister", null);
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_decorators_1 = require("../../common/decorators/auth.decorators");
let NotificationsController = class NotificationsController {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    findAll(u, page, limit) {
        return this.notificationsService.findForUser(u.tenantId, u.id, page, limit);
    }
    unreadCount(u) {
        return this.notificationsService.getUnreadCount(u.tenantId, u.id)
            .then((count) => ({ count }));
    }
    markAllRead(u) {
        return this.notificationsService.markAllRead(u.tenantId, u.id);
    }
    markRead(id, u) {
        return this.notificationsService.markRead(id, u.tenantId, u.id);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_2.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get notifications for current user' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __param(1, (0, common_2.Query)('page')),
    __param(2, (0, common_2.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "findAll", null);
__decorate([
    (0, common_2.Get)('unread-count'),
    (0, swagger_1.ApiOperation)({ summary: 'Get unread notification count' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "unreadCount", null);
__decorate([
    (0, common_2.Patch)('mark-all-read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all notifications as read' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markAllRead", null);
__decorate([
    (0, common_2.Patch)(':id/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a single notification as read' }),
    __param(0, (0, common_2.Param)('id', common_2.ParseIntPipe)),
    __param(1, (0, auth_decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markRead", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, swagger_1.ApiTags)('Notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_2.UseGuards)(auth_decorators_1.JwtAuthGuard),
    (0, common_2.Controller)('notifications'),
    __metadata("design:paramtypes", [NotificationsService])
], NotificationsController);
const common_3 = require("@nestjs/common");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_3.Module)({
        controllers: [NotificationsController],
        providers: [NotificationsService],
        exports: [NotificationsService],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map