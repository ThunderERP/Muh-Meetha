// The reorder-alerts endpoint is served through the InventoryController
// at GET /api/v1/inventory/reorder-alerts
// This file registers a standalone controller alias for backward compat

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '../../common/decorators/auth.decorators';
import { RequestUser } from '../auth/auth.types';
import { InventoryService } from './inventory.service';

@ApiTags('Reorder Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reorder-alerts')
export class ReorderAlertsController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get products at or below reorder level' })
  getReorderAlerts(
    @CurrentUser() u: RequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.getReorderAlerts(u.tenantId, Number(page) || 1, Number(limit) || 25);
  }
}
