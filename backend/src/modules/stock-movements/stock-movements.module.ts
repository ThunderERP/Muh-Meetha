// ─── stock-movements.dto.ts ───────────────────────────────────────────────────

import { IsOptional, IsString, IsIn, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StockMovementFiltersDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()
  limit?: number = 25;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()
  productId?: number;

  @ApiPropertyOptional({ enum: ['INWARD', 'OUTWARD', 'ADJUSTMENT', 'RESERVATION', 'RESERVATION_RELEASE'] })
  @IsOptional() @IsString()
  @IsIn(['INWARD', 'OUTWARD', 'ADJUSTMENT', 'RESERVATION', 'RESERVATION_RELEASE', ''])
  type?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  from?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  to?: string;
}

// ─── stock-movements.service.ts ───────────────────────────────────────────────

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: number, filters: StockMovementFiltersDto) {
    const { page = 1, limit = 25, productId, type, from, to } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      product: { tenantId },
      ...(productId ? { productId } : {}),
      ...(type      ? { type }      : {}),
      ...(from || to ? {
        createdAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to   ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
        },
      } : {}),
    };

    const [movements, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where: where as any,
        include: {
          product: { select: { id: true, name: true, sku: true, tenantId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.stockMovement.count({ where: where as any }),
    ]);

    // Enrich with user info
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

    return paginate(enriched, total, page, limit);
  }
}

// ─── stock-movements.controller.ts ───────────────────────────────────────────

import {
  Controller, Get, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  JwtAuthGuard, CurrentUser,
} from '../../common/decorators/auth.decorators';
import { RequestUser } from '../auth/auth.types';

@ApiTags('Stock Movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Get()
  @ApiOperation({ summary: 'List all stock movements with optional filters' })
  findAll(
    @CurrentUser() u: RequestUser,
    @Query() filters: StockMovementFiltersDto,
  ) {
    return this.stockMovementsService.findAll(u.tenantId, filters);
  }
}

// ─── stock-movements.module.ts ────────────────────────────────────────────────

import { Module } from '@nestjs/common';

@Module({
  controllers: [StockMovementsController],
  providers: [StockMovementsService],
  exports: [StockMovementsService],
})
export class StockMovementsModule {}
