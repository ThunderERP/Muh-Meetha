import {
  Controller, Get, Post, Body, Param,
  ParseIntPipe, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, CurrentUser, Roles } from '../../common/decorators/auth.decorators';
import { RequestUser } from '../auth/auth.types';
import { InventoryService, AdjustStockDto } from './inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Inventory dashboard KPIs and stats' })
  getDashboard(@CurrentUser() u: RequestUser) {
    return this.inventoryService.getDashboard(u.tenantId);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get inventory levels for a product' })
  getInventory(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() u: RequestUser,
  ) {
    return this.inventoryService.getHistory(productId, u.tenantId, 1, 1);
  }

  @Post(':productId/adjust')
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'INVENTORY_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Adjust stock (in / out / adjustment)' })
  adjust(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() u: RequestUser,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjust(productId, u.tenantId, u.id, dto);
  }

  @Get(':productId/history')
  @ApiOperation({ summary: 'Get stock movement history for a product' })
  getHistory(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() u: RequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.getHistory(
      productId,
      u.tenantId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }
}
