// ─── products.controller.ts ───────────────────────────────────────────────────

import {
  Controller, Get, Post, Put, Delete, Body,
  Param, ParseIntPipe, Query, UseGuards,
  Res, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductFiltersDto } from './dto/products.dto';
import {
  JwtAuthGuard, RolesGuard, CurrentUser, Roles,
} from '../../common/decorators/auth.decorators';
import { RequestUser } from '../auth/auth.types';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with filters and pagination' })
  findAll(@CurrentUser() u: RequestUser, @Query() filters: ProductFiltersDto) {
    return this.productsService.findAll(u.tenantId, filters);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all distinct product categories' })
  getCategories(@CurrentUser() u: RequestUser) {
    return this.productsService.getCategories(u.tenantId);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export products as CSV' })
  async exportCsv(@CurrentUser() u: RequestUser, @Res() res: Response) {
    const csv = await this.productsService.exportCsv(u.tenantId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="thundererp-products-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.status(HttpStatus.OK).send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: RequestUser) {
    return this.productsService.findOne(id, u.tenantId);
  }

  @Post()
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'INVENTORY_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Create a product' })
  create(@Body() dto: CreateProductDto, @CurrentUser() u: RequestUser) {
    return this.productsService.create(u.tenantId, u.id, dto);
  }

  @Put(':id')
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'INVENTORY_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Update a product' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() u: RequestUser,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, u.tenantId, u.id, dto);
  }

  @Delete(':id')
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Soft-delete a product' })
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: RequestUser) {
    return this.productsService.delete(id, u.tenantId, u.id);
  }
}

// ─── products.module.ts ───────────────────────────────────────────────────────

import { Module } from '@nestjs/common';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
