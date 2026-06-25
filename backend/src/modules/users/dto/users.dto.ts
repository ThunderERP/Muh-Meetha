// ─── DTOs ─────────────────────────────────────────────────────────────────────

import {
  IsEmail, IsString, MinLength, MaxLength,
  IsOptional, IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsString() @MinLength(2) @MaxLength(255)
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString() @MinLength(8)
  password: string;

  @ApiProperty({ example: 'INVENTORY_MANAGER' })
  @IsString()
  @IsIn([
    'BUSINESS_OWNER', 'MANAGER', 'INVENTORY_MANAGER', 'SALES_MANAGER',
    'SALES_STAFF', 'FINANCE_MANAGER', 'ACCOUNTANT', 'CRM_SUPPORT',
    'REFUND_HANDLER',
  ])
  role: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  jobTitle?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() @MinLength(2) @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MinLength(8)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  currentPassword?: string;
}

export class UpdateMeDto extends PartialType(UpdateUserDto) {}
