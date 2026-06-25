// ─── suppliers.dto.ts ─────────────────────────────────────────────────────────

import {
  IsString, IsOptional, IsEmail, MinLength, MaxLength, IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateSupplierDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(255)
  name: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50)
  code?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  state?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10)
  pincode?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  gstin?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(15)
  pan?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  bankName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  bankAccount?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  bankIfsc?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  notes?: string;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class SupplierFiltersDto {
  // Query strings arrive as strings — @Type(() => Number) converts them.
  @IsOptional() @Type(() => Number) page?:  number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 20;

  @IsOptional() @IsString() search?: string;

  /**
   * isActive arrives from the query string as the string "true" or "false".
   * @Transform converts it to a real boolean before @IsBoolean() validates it.
   * Without this, class-validator rejects the string and the filter is silently dropped.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true')  return true;
    if (value === 'false') return false;
    return value; // let @IsBoolean() fail it if it's something else
  })
  @IsBoolean()
  isActive?: boolean;
}

// ─── suppliers.service.ts ─────────────────────────────────────────────────────

import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async findAll(tenantId: number, filters: SupplierFiltersDto) {
    const { page = 1, limit = 20, search, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      tenantId,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search ? {
        OR: [
          { name:  { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { code:  { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [suppliers, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where: where as any,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.supplier.count({ where: where as any }),
    ]);

    return paginate(suppliers, total, page, limit);
  }

  async findOne(id: number, tenantId: number) {
    const s = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
    });
    if (!s) throw new NotFoundException(`Supplier #${id} not found`);
    return s;
  }

  async create(tenantId: number, userId: number, dto: CreateSupplierDto) {
    const supplier = await this.prisma.$transaction(async (tx) => {
      const s = await tx.supplier.create({
        data: { tenantId, ...dto, createdBy: userId },
      });
      await tx.auditLog.create({
        data: {
          tenantId, userId,
          action: 'CREATE', module: 'inventory', entityType: 'supplier', entityId: s.id,
          after: dto as any,
        },
      });
      return s;
    });

    this.events.emit('inventory.supplier.created', { tenantId, supplierId: supplier.id });
    return supplier;
  }

  async update(id: number, tenantId: number, userId: number, dto: UpdateSupplierDto) {
    const existing = await this.findOne(id, tenantId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const s = await tx.supplier.update({ where: { id }, data: dto });
      await tx.auditLog.create({
        data: {
          tenantId, userId,
          action: 'UPDATE', module: 'inventory', entityType: 'supplier', entityId: id,
          before: existing as any, after: dto as any,
        },
      });
      return s;
    });
    return updated;
  }

  async remove(id: number, tenantId: number, userId: number) {
    const existing = await this.findOne(id, tenantId);
    await this.prisma.$transaction(async (tx) => {
      await tx.supplier.update({ where: { id }, data: { isActive: false } });
      await tx.auditLog.create({
        data: {
          tenantId, userId,
          action: 'DELETE', module: 'inventory', entityType: 'supplier', entityId: id,
          before: existing as any,
        },
      });
    });
    return { message: 'Supplier removed successfully' };
  }
}

// ─── suppliers.controller.ts ──────────────────────────────────────────────────

import {
  Controller, Get, Post, Put, Delete, Body,
  Param, ParseIntPipe, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  JwtAuthGuard, RolesGuard, CurrentUser, Roles,
} from '../../common/decorators/auth.decorators';
import { RequestUser } from '../auth/auth.types';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'List all suppliers' })
  findAll(@CurrentUser() u: RequestUser, @Query() filters: SupplierFiltersDto) {
    return this.suppliersService.findAll(u.tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: RequestUser) {
    return this.suppliersService.findOne(id, u.tenantId);
  }

  @Post()
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'INVENTORY_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Create a supplier' })
  create(@Body() dto: CreateSupplierDto, @CurrentUser() u: RequestUser) {
    return this.suppliersService.create(u.tenantId, u.id, dto);
  }

  @Put(':id')
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'INVENTORY_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Update a supplier' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() u: RequestUser,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, u.tenantId, u.id, dto);
  }

  @Delete(':id')
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'INVENTORY_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Deactivate / remove a supplier' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: RequestUser) {
    return this.suppliersService.remove(id, u.tenantId, u.id);
  }
}

// ─── suppliers.module.ts ──────────────────────────────────────────────────────

import { Module } from '@nestjs/common';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
