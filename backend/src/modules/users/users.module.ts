// ─── users.controller.ts ──────────────────────────────────────────────────────

import {
  Controller, Get, Post, Put, Patch, Body,
  Param, ParseIntPipe, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateMeDto, UpdateUserDto } from './dto/users.dto';
import { SearchPaginationDto } from '../../common/dto/pagination.dto';
import {
  JwtAuthGuard, RolesGuard,
  CurrentUser, Roles,
} from '../../common/decorators/auth.decorators';
import { RequestUser } from '../auth/auth.types';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users in the workspace' })
  findAll(@CurrentUser() user: RequestUser, @Query() dto: SearchPaginationDto) {
    return this.usersService.findAll(user.tenantId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  getMe(@CurrentUser() user: RequestUser) {
    return this.usersService.getMe(user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update own profile / password' })
  updateMe(@CurrentUser() user: RequestUser, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.id, user.tenantId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser) {
    return this.usersService.findOne(id, user.tenantId);
  }

  @Post()
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create a new user in the workspace' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: RequestUser) {
    return this.usersService.create(user.tenantId, dto, user.id);
  }

  @Put(':id')
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update a user' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, user.tenantId, user.id, dto);
  }

  @Patch(':id/deactivate')
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Deactivate a user' })
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.usersService.deactivate(id, user.tenantId, user.id);
  }

  @Patch(':id/activate')
  @Roles('DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Reactivate a user' })
  activate(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser) {
    return this.usersService.activate(id, user.tenantId, user.id);
  }
}

// ─── users.module.ts ──────────────────────────────────────────────────────────

import { Module } from '@nestjs/common';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
