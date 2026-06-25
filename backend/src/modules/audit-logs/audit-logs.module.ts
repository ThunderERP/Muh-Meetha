// ─── audit-logs.service.ts ────────────────────────────────────────────────────

import { Injectable } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';

export class AuditLogFiltersDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number)
  limit?: number = 30;

  @ApiPropertyOptional() @IsOptional() @IsString()
  module?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  entity?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  action?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  from?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  to?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: number, filters: AuditLogFiltersDto) {
    const { page = 1, limit = 30, module, entity, action, from, to } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      tenantId,
      ...(module ? { module: { contains: module, mode: 'insensitive' as const } } : {}),
      ...(entity ? { entityType: { contains: entity, mode: 'insensitive' as const } } : {}),
      ...(action ? { action } : {}),
      ...(from || to ? {
        createdAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to   ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
        },
      } : {}),
    };

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where: where as any,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: where as any }),
    ]);

    return paginate(logs, total, page, limit);
  }
}

// ─── audit-logs.controller.ts ─────────────────────────────────────────────────

import {
  Controller, Get, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  JwtAuthGuard, RolesGuard, Roles, CurrentUser,
} from '../../common/decorators/auth.decorators';
import { RequestUser } from '../auth/auth.types';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'FINANCE_MANAGER')
  @ApiOperation({ summary: 'List audit logs for the tenant' })
  findAll(@CurrentUser() u: RequestUser, @Query() filters: AuditLogFiltersDto) {
    return this.auditLogsService.findAll(u.tenantId, filters);
  }
}

// ─── audit-logs.module.ts ─────────────────────────────────────────────────────

import { Module } from '@nestjs/common';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
