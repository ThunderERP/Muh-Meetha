// ─── tenants.dto.ts ───────────────────────────────────────────────────────────

import { IsString, IsOptional, MaxLength, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  legalName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional() @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  website?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  gstin?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(15)
  pan?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(25)
  cin?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  industry?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  businessType?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  country?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  state?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  city?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10)
  pincode?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  address?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  timezone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10)
  currency?: string;
}

// ─── tenants.service.ts ───────────────────────────────────────────────────────

import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TENANT_SELECT = {
  id: true, slug: true, name: true, legalName: true, plan: true,
  isActive: true, maxUsers: true, storageQuotaMb: true,
  phone: true, email: true, website: true, gstin: true, pan: true, cin: true,
  industry: true, businessType: true, country: true, state: true,
  city: true, pincode: true, address: true, timezone: true,
  currency: true, fiscalYearStart: true, isEmailVerified: true,
  createdAt: true, updatedAt: true,
};

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(tenantId: number) {
    return this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: TENANT_SELECT,
    });
  }

  async update(tenantId: number, userId: number, role: string, dto: UpdateTenantDto) {
    if (!['DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER'].includes(role)) {
      throw new ForbiddenException('Only admins can update company details');
    }
    const updated = await this.prisma.tenant.update({
      where:  { id: tenantId },
      data:   dto,
      select: TENANT_SELECT,
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action:     'UPDATE',
        module:     'company',
        entityType: 'tenant',
        entityId:   tenantId,
        after:      dto as any,
      },
    });

    return updated;
  }

  async getModules(tenantId: number) {
    return this.prisma.companyModule.findMany({
      where: { tenantId },
      orderBy: { moduleKey: 'asc' },
    });
  }

  async getSubscription(tenantId: number) {
    return this.prisma.subscription.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { startsAt: 'desc' },
    });
  }
}

// ─── tenants.controller.ts ────────────────────────────────────────────────────

import {
  Controller, Get, Put, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  JwtAuthGuard, CurrentUser,
} from '../../common/decorators/auth.decorators';
import { RequestUser } from '../auth/auth.types';

@ApiTags('Company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('company')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Get company profile' })
  getCompany(@CurrentUser() user: RequestUser) {
    return this.tenantsService.findOne(user.tenantId);
  }

  @Put()
  @ApiOperation({ summary: 'Update company profile' })
  updateCompany(@CurrentUser() user: RequestUser, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(user.tenantId, user.id, user.role, dto);
  }

  @Get('modules')
  @ApiOperation({ summary: 'Get activated modules for this company' })
  getModules(@CurrentUser() user: RequestUser) {
    return this.tenantsService.getModules(user.tenantId);
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Get current subscription details' })
  getSubscription(@CurrentUser() user: RequestUser) {
    return this.tenantsService.getSubscription(user.tenantId);
  }
}

// ─── tenants.module.ts ────────────────────────────────────────────────────────

import { Module } from '@nestjs/common';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
