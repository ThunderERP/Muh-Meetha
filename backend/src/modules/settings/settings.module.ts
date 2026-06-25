// ─── settings.service.ts ──────────────────────────────────────────────────────

import { Injectable } from '@nestjs/common';
import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

export class UpsertCompanySettingDto {
  @ApiProperty({ example: 'inventory' }) @IsString()
  module: string;

  @ApiProperty({ example: 'inv_show_gst' }) @IsString()
  key: string;

  @ApiProperty()
  value: unknown;
}

export class UpdateUserSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  theme?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  timezone?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  dateFormat?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  invShowSku?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  invShowGst?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  invShowDiscount?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  invShowReorderLevel?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  invShowImage?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  invShowMfgDate?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  invShowExpiryDate?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  sidebarCollapsed?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  notifyLowStock?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  notifyOrderUpdates?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  notifyPayments?: boolean;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Company Settings ───────────────────────────────────────────────────────

  async getCompanySettings(tenantId: number, module?: string) {
    return this.prisma.companySetting.findMany({
      where: { tenantId, ...(module ? { module } : {}) },
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });
  }

  async upsertCompanySetting(tenantId: number, dto: UpsertCompanySettingDto) {
    return this.prisma.companySetting.upsert({
      where: {
        tenantId_module_key: { tenantId, module: dto.module, key: dto.key },
      },
      create: { tenantId, module: dto.module, key: dto.key, value: JSON.parse(JSON.stringify(dto.value ?? null)) },
      update: { value: JSON.parse(JSON.stringify(dto.value ?? null)) },
    });
  }

  async bulkUpsertCompanySettings(
    tenantId: number,
    settings: UpsertCompanySettingDto[],
  ) {
    const results = await Promise.all(
      settings.map((s) => this.upsertCompanySetting(tenantId, s)),
    );
    return { updated: results.length, settings: results };
  }

  // ─── User Settings ──────────────────────────────────────────────────────────

  async getUserSettings(userId: number) {
    return this.prisma.userSettings.findUnique({
      where: { userId },
    });
  }

  async updateUserSettings(userId: number, dto: UpdateUserSettingsDto) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  // ─── Feature Flags ──────────────────────────────────────────────────────────

  async getFeatureFlags(tenantId: number) {
    return this.prisma.featureFlag.findMany({
      where: { OR: [{ tenantId }, { tenantId: null }] },
      orderBy: { key: 'asc' },
    });
  }

  async isFeatureEnabled(tenantId: number, key: string): Promise<boolean> {
    // Tenant-specific flag takes priority over global
    const tenantFlag = await this.prisma.featureFlag.findFirst({
      where: { tenantId, key },
      select: { enabled: true },
    });
    if (tenantFlag !== null) return tenantFlag?.enabled ?? false;

    const globalFlag = await this.prisma.featureFlag.findFirst({
      where: { tenantId: null, key },
      select: { enabled: true },
    });
    return globalFlag?.enabled ?? false;
  }
}

// ─── settings.controller.ts ───────────────────────────────────────────────────

import {
  Controller, Get, Post, Put, Body,
  Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  JwtAuthGuard, RolesGuard, Roles, CurrentUser,
} from '../../common/decorators/auth.decorators';
import { RequestUser } from '../auth/auth.types';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ── Company settings ───────────────────────────────────────────────────────
  @Get('company')
  @ApiOperation({ summary: 'Get company settings (optionally filtered by module)' })
  getCompanySettings(
    @CurrentUser() u: RequestUser,
    @Query('module') module?: string,
  ) {
    return this.settingsService.getCompanySettings(u.tenantId, module);
  }

  @Post('company')
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create or update a company setting' })
  upsertCompanySetting(
    @CurrentUser() u: RequestUser,
    @Body() dto: UpsertCompanySettingDto,
  ) {
    return this.settingsService.upsertCompanySetting(u.tenantId, dto);
  }

  @Post('company/bulk')
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Bulk upsert company settings' })
  bulkUpsertCompanySettings(
    @CurrentUser() u: RequestUser,
    @Body() dto: { settings: UpsertCompanySettingDto[] },
  ) {
    return this.settingsService.bulkUpsertCompanySettings(u.tenantId, dto.settings);
  }

  // ── User settings ──────────────────────────────────────────────────────────
  @Get('user')
  @ApiOperation({ summary: 'Get current user settings / preferences' })
  getUserSettings(@CurrentUser() u: RequestUser) {
    return this.settingsService.getUserSettings(u.id);
  }

  @Put('user')
  @ApiOperation({ summary: 'Update current user settings / preferences' })
  updateUserSettings(
    @CurrentUser() u: RequestUser,
    @Body() dto: UpdateUserSettingsDto,
  ) {
    return this.settingsService.updateUserSettings(u.id, dto);
  }

  // ── Feature flags ──────────────────────────────────────────────────────────
  @Get('features')
  @ApiOperation({ summary: 'Get feature flags for this tenant' })
  getFeatureFlags(@CurrentUser() u: RequestUser) {
    return this.settingsService.getFeatureFlags(u.tenantId);
  }
}

// ─── settings.module.ts ───────────────────────────────────────────────────────

import { Module } from '@nestjs/common';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
