// ─── notifications.service.ts ─────────────────────────────────────────────────

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Query ─────────────────────────────────────────────────────────────────

  async findForUser(tenantId: number, userId: number, page = 1, limit = 20) {
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
    return paginate(notifications, total, page, limit);
  }

  async getUnreadCount(tenantId: number, userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: { tenantId, userId, readAt: null },
    });
  }

  async markAllRead(tenantId: number, userId: number) {
    await this.prisma.notification.updateMany({
      where: { tenantId, userId, readAt: null },
      data:  { readAt: new Date(), status: 'READ' },
    });
    return { message: 'All notifications marked as read' };
  }

  /**
   * Mark a single notification as read.
   * Verifies ownership (tenantId + userId) before updating to prevent
   * cross-tenant/cross-user ID enumeration attacks.
   */
  async markRead(id: number, tenantId: number, userId: number) {
    // Find the notification scoped to this user and tenant first.
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId, userId },
      select: { id: true, readAt: true },
    });

    if (!notification) {
      // Return 404 rather than 403 to avoid leaking whether the ID exists at all.
      throw new NotFoundException('Notification not found');
    }

    // Already read — return it without an unnecessary write.
    if (notification.readAt) {
      return this.prisma.notification.findUnique({ where: { id } });
    }

    return this.prisma.notification.update({
      where: { id },
      data:  { readAt: new Date(), status: 'READ' },
    });
  }

  // ─── Internal creation ─────────────────────────────────────────────────────

  async createForTenantAdmins(
    tenantId: number,
    title:   string,
    body:    string,
    data?:   Record<string, unknown>,
  ) {
    const admins = await this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        role: { in: ['DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'INVENTORY_MANAGER'] as unknown as import('@prisma/client').Role[] },
      },
      select: { id: true },
    });

    if (admins.length === 0) return;

    await this.prisma.notification.createMany({
      data: admins.map((a) => ({
        tenantId,
        userId:  a.id,
        channel: 'IN_APP' as const,
        status:  'DELIVERED' as const,
        title,
        body,
        data:    data ? (JSON.parse(JSON.stringify(data)) as object) : undefined,
        sentAt:  new Date(),
      })),
    });
  }

  // ─── Event Listeners ───────────────────────────────────────────────────────

  @OnEvent('inventory.low_stock')
  async onLowStock(payload: {
    tenantId:     number;
    productId:    number;
    availableQty: number;
    reorderLevel: number;
  }) {
    try {
      const product = await this.prisma.product.findUnique({
        where:  { id: payload.productId },
        select: { name: true, sku: true },
      });
      if (!product) return;

      await this.createForTenantAdmins(
        payload.tenantId,
        `⚠️ Low Stock Alert: ${product.name}`,
        `${product.name}${product.sku ? ` (${product.sku})` : ''} has only ${payload.availableQty} units left (reorder level: ${payload.reorderLevel}).`,
        { type: 'LOW_STOCK', productId: payload.productId, availableQty: payload.availableQty },
      );
    } catch (err) {
      this.logger.error('Failed to create low-stock notification', err);
    }
  }

  @OnEvent('inventory.out_of_stock')
  async onOutOfStock(payload: { tenantId: number; productId: number }) {
    try {
      const product = await this.prisma.product.findUnique({
        where:  { id: payload.productId },
        select: { name: true, sku: true },
      });
      if (!product) return;

      await this.createForTenantAdmins(
        payload.tenantId,
        `🚨 Out of Stock: ${product.name}`,
        `${product.name}${product.sku ? ` (${product.sku})` : ''} is now completely out of stock. Immediate restocking required.`,
        { type: 'OUT_OF_STOCK', productId: payload.productId },
      );
    } catch (err) {
      this.logger.error('Failed to create out-of-stock notification', err);
    }
  }

  @OnEvent('auth.register')
  async onRegister(payload: { userId: number; tenantId: number }) {
    try {
      await this.prisma.notification.create({
        data: {
          tenantId: payload.tenantId,
          userId:   payload.userId,
          channel:  'IN_APP',
          status:   'DELIVERED',
          title:    '🎉 Welcome to ThunderERP!',
          body:     'Your workspace is ready. Start by adding your first product in the Inventory module.',
          data:     JSON.parse(JSON.stringify({ type: 'WELCOME', url: '/inventory/products' })) as object,
          sentAt:   new Date(),
        },
      });
    } catch (err) {
      this.logger.error('Failed to create welcome notification', err);
    }
  }
}

// ─── notifications.controller.ts ─────────────────────────────────────────────

import {
  Controller, Get, Patch, Param, ParseIntPipe,
  Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  JwtAuthGuard, CurrentUser,
} from '../../common/decorators/auth.decorators';
import { RequestUser } from '../auth/auth.types';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  findAll(
    @CurrentUser() u: RequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.findForUser(u.tenantId, u.id, page, limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  unreadCount(@CurrentUser() u: RequestUser) {
    return this.notificationsService.getUnreadCount(u.tenantId, u.id)
      .then((count) => ({ count }));
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() u: RequestUser) {
    return this.notificationsService.markAllRead(u.tenantId, u.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() u: RequestUser,
  ) {
    return this.notificationsService.markRead(id, u.tenantId, u.id);
  }
}

// ─── notifications.module.ts ──────────────────────────────────────────────────

import { Module } from '@nestjs/common';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
