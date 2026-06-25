import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate, SearchPaginationDto } from '../../common/dto/pagination.dto';
import { CreateUserDto, UpdateUserDto, UpdateMeDto } from './dto/users.dto';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

const SELECT = {
  id: true, name: true, email: true, role: true,
  tenantId: true, isActive: true, phone: true,
  jobTitle: true, avatarUrl: true, createdAt: true, updatedAt: true,
};

@Injectable()
export class UsersService {
  private readonly bcryptRounds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.bcryptRounds = parseInt(config.get('BCRYPT_ROUNDS', '12'), 10);
  }

  // ─── Reads ────────────────────────────────────────────────────────────────────

  async findAll(tenantId: number, dto: SearchPaginationDto) {
    const { page = 1, limit = 20, search } = dto;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(search ? {
        OR: [
          { name:  { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip, take: limit, select: SELECT, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(users, total, page, limit);
  }

  async findOne(id: number, tenantId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: SELECT,
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async getMe(userId: number) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: SELECT });
  }

  // ─── Writes (all use withTenantContext to activate RLS for the transaction) ──

  async create(tenantId: number, dto: CreateUserDto, createdBy: number) {
    // Plan limit check — read-only pre-flight
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { maxUsers: true },
    });
    const count = await this.prisma.user.count({ where: { tenantId, isActive: true } });
    if (count >= tenant.maxUsers) {
      throw new BadRequestException(
        `Your plan allows a maximum of ${tenant.maxUsers} users. Please upgrade to add more.`,
      );
    }

    // Email uniqueness pre-flight — read-only
    const exists = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (exists) throw new ConflictException('Email already registered in this workspace');

    // bcrypt is CPU-bound — do it before entering the transaction to keep tx short
    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);

    return this.prisma.withTenantContext(tenantId, createdBy, async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          name:         dto.name,
          email:        dto.email.toLowerCase(),
          passwordHash,
          role:         dto.role as any,
          phone:        dto.phone,
          jobTitle:     dto.jobTitle,
          createdBy,
        },
        select: SELECT,
      });

      // Default settings row — must exist before the user can reach the settings page
      await tx.userSettings.create({ data: { userId: user.id } });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: createdBy,
          action:     'CREATE',
          module:     'users',
          entityType: 'user',
          entityId:   user.id,
          after:      { name: dto.name, email: dto.email, role: dto.role } as any,
        },
      });

      return user;
    });
  }

  async updateMe(userId: number, tenantId: number, dto: UpdateMeDto) {
    if (dto.password) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required to set a new password');
      }
      // Fetch full user (with hash) outside tx — read-only
      const self = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
      const valid = await bcrypt.compare(dto.currentPassword, self.passwordHash);
      if (!valid) throw new BadRequestException('Current password is incorrect');
    }
    return this.update(userId, tenantId, userId, dto);
  }

  async update(id: number, tenantId: number, requesterId: number, dto: UpdateUserDto) {
    await this.findOne(id, tenantId); // confirms exists & belongs to tenant

    if (dto.email) {
      const conflict = await this.prisma.user.findFirst({
        where: { tenantId, email: dto.email.toLowerCase(), id: { not: id } },
        select: { id: true },
      });
      if (conflict) throw new ConflictException('Email already in use');
    }

    // Hash outside the transaction — CPU-bound work should not hold a tx open
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);
    }

    return this.prisma.withTenantContext(tenantId, requesterId, async (tx) => {
      const data: Record<string, unknown> = {
        ...(dto.name     ? { name:     dto.name }                : {}),
        ...(dto.email    ? { email:    dto.email.toLowerCase() } : {}),
        ...(dto.phone    ? { phone:    dto.phone }               : {}),
        ...(dto.jobTitle ? { jobTitle: dto.jobTitle }            : {}),
        ...(passwordHash  ? { passwordHash }                     : {}),
      };

      const updated = await tx.user.update({ where: { id }, data, select: SELECT });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: requesterId,
          action:     'UPDATE',
          module:     'users',
          entityType: 'user',
          entityId:   id,
          after:      { ...dto, password: undefined } as any,
        },
      });

      return updated;
    });
  }

  async deactivate(id: number, tenantId: number, requesterId: number) {
    if (id === requesterId) throw new ForbiddenException('You cannot deactivate your own account');
    await this.findOne(id, tenantId);

    return this.prisma.withTenantContext(tenantId, requesterId, async (tx) => {
      const updated = await tx.user.update({ where: { id }, data: { isActive: false }, select: SELECT });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: requesterId,
          action:     'DEACTIVATE',
          module:     'users',
          entityType: 'user',
          entityId:   id,
        },
      });

      return updated;
    });
  }

  async activate(id: number, tenantId: number, requesterId: number) {
    await this.findOne(id, tenantId);

    return this.prisma.withTenantContext(tenantId, requesterId, async (tx) => {
      const updated = await tx.user.update({ where: { id }, data: { isActive: true }, select: SELECT });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: requesterId,
          action:     'ACTIVATE',
          module:     'users',
          entityType: 'user',
          entityId:   id,
        },
      });

      return updated;
    });
  }
}
