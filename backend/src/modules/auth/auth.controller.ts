import {
  Controller, Post, Get, Body, Req, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginTenantDto, RegisterTenantDto, ChangePasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/decorators/auth.decorators';
import { CurrentUser, Public } from '../../common/decorators/auth.decorators';
import { RequestUser } from './auth.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login-tenant')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Login with company slug + email + password' })
  loginTenant(@Body() dto: LoginTenantDto, @Req() req: Request) {
    return this.authService.loginByTenant(dto, req.ip);
  }

  @Public()
  @Post('register-tenant')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 3_600_000, limit: 5 } }) // 5 registrations per hour per IP
  @ApiOperation({ summary: 'Register a new company and admin account' })
  registerTenant(@Body() dto: RegisterTenantDto, @Req() req: Request) {
    return this.authService.registerOrganisation(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user and tenant profile' })
  me(@CurrentUser() user: RequestUser) {
    return this.authService.getMe(user.id, user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Change current user password' })
  changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.changePassword(user.id, dto, req.ip);
  }
}
