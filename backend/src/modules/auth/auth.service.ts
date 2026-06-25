import {
  Injectable, UnauthorizedException, ConflictException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginTenantDto, RegisterTenantDto, ChangePasswordDto } from './dto/auth.dto';
import { JwtPayload } from './auth.types';

const USER_SELECT = {
  id: true, name: true, email: true, role: true,
  tenantId: true, isActive: true, phone: true,
  jobTitle: true, avatarUrl: true, createdAt: true,
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly bcryptRounds: number;

  constructor(
    private readonly prisma:  PrismaService,
    private readonly jwt:     JwtService,
    private readonly config:  ConfigService,
    private readonly events:  EventEmitter2,
  ) {
    this.bcryptRounds = parseInt(config.get('BCRYPT_ROUNDS', '12'), 10);
  }

  // ─── Login ──────────────────────────────────────────────────────────────────

  async loginByTenant(dto: LoginTenantDto, ip?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
      select: { id: true, slug: true, name: true, plan: true, isActive: true,
                maxUsers: true, storageQuotaMb: true, timezone: true, currency: true,
                industry: true, phone: true, website: true, gstin: true,
                country: true, isEmailVerified: true },
    });

    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Company not found or inactive');
    }

    const user = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, email: dto.email.toLowerCase(), isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    const accessToken = this.signToken(user.id, user.email, user.role, tenant.id);

    this.events.emit('auth.login', { userId: user.id, tenantId: tenant.id, ip });

    const { passwordHash: _, ...safeUser } = user;
    return { accessToken, user: safeUser, tenant };
  }

  // ─── Register Organisation ───────────────────────────────────────────────────

  async registerOrganisation(dto: RegisterTenantDto, ip?: string, userAgent?: string) {
    if (!dto.tosAccepted || !dto.privacyAccepted) {
      throw new BadRequestException(
        'You must accept the Terms of Service and Privacy Policy to register.',
      );
    }

    const slugExists = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (slugExists) {
      throw new ConflictException(
        `Workspace ID "${dto.slug}" is already taken. Please choose another.`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create tenant
      const tenant = await tx.tenant.create({
        data: {
          slug:     dto.slug,
          name:     dto.companyName,
          plan:     'STARTER',
          industry: dto.industry,
          phone:    dto.phone,
          email:    dto.adminEmail,
          website:  dto.website,
          gstin:    dto.gstin,
          tosAcceptedAt: new Date(),
          tosAcceptedIp: ip,
        },
      });

      // 2. Create admin user
      const user = await tx.user.create({
        data: {
          tenantId:     tenant.id,
          name:         dto.adminName,
          email:        dto.adminEmail.toLowerCase(),
          passwordHash,
          role:         'BUSINESS_OWNER',
          jobTitle:     dto.jobTitle,
          phone:        dto.phone,
          lastLoginAt:  new Date(),
          lastLoginIp:  ip,
          createdBy:    0, // self-registration
        },
      });

      // 3. Default user settings
      await tx.userSettings.create({ data: { userId: user.id } });

      // 4. Activate INVENTORY module by default
      await tx.companyModule.create({
        data: {
          tenantId:    tenant.id,
          moduleKey:   'INVENTORY',
          status:      'ACTIVE',
          activatedAt: new Date(),
        },
      });

      // 5. Compliance audit trail
      await tx.termsAcceptance.createMany({
        data: [
          { userId: user.id, tenantId: tenant.id, version: 'tos-v1.0',     ipAddress: ip, userAgent },
          { userId: user.id, tenantId: tenant.id, version: 'privacy-v1.0', ipAddress: ip, userAgent },
        ],
      });

      // 6. Subscription record
      await tx.subscription.create({
        data: {
          tenantId:  tenant.id,
          plan:      'STARTER',
          startsAt:  new Date(),
          isActive:  true,
          maxUsers:  10,
          storageMb: 500,
        },
      });

      // 7. Audit log
      await tx.auditLog.create({
        data: {
          tenantId:   tenant.id,
          userId:     user.id,
          action:     'CREATE',
          module:     'auth',
          entityType: 'tenant',
          entityId:   tenant.id,
          after:      { slug: tenant.slug, name: tenant.name } as any,
          ipAddress:  ip,
          userAgent,
        },
      });

      const accessToken = this.signToken(user.id, user.email, user.role, tenant.id);

      this.events.emit('auth.register', { userId: user.id, tenantId: tenant.id });

      const { passwordHash: _, ...safeUser } = user;
      return {
        accessToken,
        user: safeUser,
        tenant: {
          id: tenant.id, slug: tenant.slug, name: tenant.name,
          plan: tenant.plan, isActive: tenant.isActive,
          maxUsers: tenant.maxUsers, storageQuotaMb: tenant.storageQuotaMb,
          timezone: tenant.timezone, currency: tenant.currency,
          country: tenant.country,
        },
        message: 'Company registered successfully. Welcome to ThunderERP!',
      };
    });
  }

  // ─── Get Profile ─────────────────────────────────────────────────────────────

  async getMe(userId: number, tenantId: number) {
    const [user, tenant] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: USER_SELECT,
      }),
      this.prisma.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: {
          id: true, slug: true, name: true, plan: true, isActive: true,
          maxUsers: true, storageQuotaMb: true, timezone: true, currency: true,
          country: true, industry: true, phone: true, gstin: true,
        },
      }),
    ]);
    return { user, tenant };
  }

  // ─── Change Password ──────────────────────────────────────────────────────────

  async changePassword(userId: number, dto: ChangePasswordDto, ip?: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hash = await bcrypt.hash(dto.newPassword, this.bcryptRounds);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash, updatedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId:   user.tenantId,
        userId:     user.id,
        action:     'UPDATE',
        module:     'auth',
        entityType: 'user',
        entityId:   user.id,
        after:      { passwordChanged: true } as any,
        ipAddress:  ip,
      },
    });

    return { message: 'Password changed successfully' };
  }

  // ─── Token ────────────────────────────────────────────────────────────────────

  private signToken(userId: number, email: string, role: string, tenantId: number): string {
    const payload: JwtPayload = { sub: userId, email, role, tenantId };
    return this.jwt.sign(payload);
  }
}
