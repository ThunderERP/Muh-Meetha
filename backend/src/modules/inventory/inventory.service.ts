import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';
import { ProductsService } from '../products/products.service';
import { IsString, IsNumber, IsOptional, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({ enum: ['INWARD', 'OUTWARD', 'ADJUSTMENT', 'RESERVATION', 'RESERVATION_RELEASE'] })
  @IsString()
  @IsIn(['INWARD', 'OUTWARD', 'ADJUSTMENT', 'RESERVATION', 'RESERVATION_RELEASE'])
  type: string;

  /**
   * For INWARD / OUTWARD / RESERVATION / RESERVATION_RELEASE: a positive integer
   * representing units to add or remove.
   *
   * For ADJUSTMENT: a signed integer.
   *   Positive → adds to current stock (same as INWARD but logged as a manual correction).
   *   Negative → removes from current stock (e.g. shrinkage, write-off).
   *
   * The frontend stock-adjustment modal should use a number input that allows
   * negative values when the ADJUSTMENT type is selected.
   */
  @ApiProperty({ description: 'Positive integer for INWARD/OUTWARD/RESERVATION. Signed integer for ADJUSTMENT.' })
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  quantity: number;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  referenceType?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()
  referenceId?: number;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma:   PrismaService,
    private readonly products: ProductsService,
    private readonly events:   EventEmitter2,
  ) {}

  async adjust(productId: number, tenantId: number, userId: number, dto: AdjustStockDto) {
    const product = await this.products.findOne(productId, tenantId);
    const inv = product.inventory;
    if (!inv) throw new NotFoundException('Inventory record not found for this product');

    const currentQty    = inv.availableQty;
    const currentReserved = inv.reservedQty;
    let newQty      = currentQty;
    let newReserved = currentReserved;

    switch (dto.type) {
      case 'INWARD':
        if (dto.quantity <= 0) {
          throw new BadRequestException('INWARD quantity must be a positive number');
        }
        newQty = currentQty + dto.quantity;
        break;

      case 'OUTWARD':
        if (dto.quantity <= 0) {
          throw new BadRequestException('OUTWARD quantity must be a positive number');
        }
        if (dto.quantity > currentQty) {
          throw new BadRequestException(
            `Insufficient stock. Available: ${currentQty}, Requested: ${dto.quantity}`,
          );
        }
        newQty = currentQty - dto.quantity;
        break;

      case 'ADJUSTMENT':
        // quantity is signed: positive adds, negative removes.
        newQty = currentQty + dto.quantity;
        if (newQty < 0) {
          throw new BadRequestException(
            `Adjustment would result in negative stock (current: ${currentQty}, delta: ${dto.quantity})`,
          );
        }
        break;

      case 'RESERVATION':
        if (dto.quantity <= 0) {
          throw new BadRequestException('RESERVATION quantity must be a positive number');
        }
        if (dto.quantity > currentQty) {
          throw new BadRequestException(
            `Cannot reserve more than available stock. Available: ${currentQty}, Requested: ${dto.quantity}`,
          );
        }
        newReserved = currentReserved + dto.quantity;
        // availableQty stays the same — reservation is a soft hold, not a deduction.
        break;

      case 'RESERVATION_RELEASE':
        if (dto.quantity <= 0) {
          throw new BadRequestException('RESERVATION_RELEASE quantity must be a positive number');
        }
        newReserved = Math.max(0, currentReserved - dto.quantity);
        break;

      default:
        throw new BadRequestException(`Unknown movement type: ${dto.type}`);
    }

    const isAvailableChange  = ['INWARD', 'OUTWARD', 'ADJUSTMENT'].includes(dto.type);
    const isReservationChange = ['RESERVATION', 'RESERVATION_RELEASE'].includes(dto.type);

    const result = await this.prisma.withTenantContext(tenantId, userId, async (tx) => {
      const updatedInv = await tx.inventory.update({
        where: { productId },
        data: {
          ...(isAvailableChange  ? { availableQty: newQty }      : {}),
          ...(isReservationChange ? { reservedQty: newReserved }  : {}),
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type:          dto.type as any,
          quantity:      Math.abs(dto.quantity), // store absolute value; type conveys direction
          stockBefore:   currentQty,
          // For reservation changes, stockAfter reflects available qty unchanged;
          // for all others it reflects the new availableQty.
          stockAfter:    isAvailableChange ? newQty : currentQty,
          referenceType: dto.referenceType || 'MANUAL',
          referenceId:   dto.referenceId,
          notes:         dto.notes,
          createdBy:     userId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action:     'UPDATE',
          module:     'inventory',
          entityType: 'inventory',
          entityId:   productId,
          before: {
            availableQty:  currentQty,
            reservedQty:   currentReserved,
          } as any,
          after: {
            availableQty:  isAvailableChange  ? newQty      : currentQty,
            reservedQty:   isReservationChange ? newReserved : currentReserved,
            type:          dto.type,
            quantity:      dto.quantity,
          } as any,
        },
      });

      return { inventory: updatedInv, movement };
    });

    // Stock-level event emission uses the updated availableQty.
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

  async getHistory(productId: number, tenantId: number, page = 1, limit = 20) {
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

    return paginate(movements, total, page, limit);
  }

  async getReorderAlerts(tenantId: number, page = 1, limit = 25) {
    const allProducts = await this.prisma.product.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      include: { inventory: true },
      orderBy: { name: 'asc' },
    });

    const alerts = allProducts.filter((p) => {
      const qty     = p.inventory?.availableQty ?? 0;
      const reorder = p.inventory?.reorderLevel  ?? 10;
      return qty <= reorder;
    });

    const total  = alerts.length;
    const start  = (page - 1) * limit;
    const paged  = alerts.slice(start, start + limit);

    return paginate(paged, total, page, limit);
  }

  async getDashboard(tenantId: number) {
    return this.products.getDashboardStats(tenantId);
  }
}
