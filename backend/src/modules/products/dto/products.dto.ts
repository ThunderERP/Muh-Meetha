// ─── products.dto.ts ──────────────────────────────────────────────────────────

import {
  IsString, IsNumber, IsOptional, IsBoolean, Min, Max,
  MinLength, MaxLength, IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(255)
  name: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  category?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  subcategory?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  brand?: string;

  @ApiProperty({ default: 'Piece' }) @IsString() @MaxLength(50)
  unit: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  hsn?: string;

  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0)
  price: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({ default: 18 })
  @IsOptional() @Type(() => Number) @IsNumber()
  @IsIn([0, 0.1, 0.25, 1, 1.5, 3, 5, 7.5, 12, 18, 28])
  gstPercentage?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional() @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  expiryDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  manufacturingDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  reorderLevel?: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductFiltersDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(200)
  limit?: number = 20;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsIn(['active', 'inactive', 'low_stock', 'out_of_stock'])
  status?: string;

  @IsOptional() @IsString()
  sortBy?: string;

  @IsOptional() @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
