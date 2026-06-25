"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const bcrypt = require("bcryptjs");
const config_1 = require("@nestjs/config");
const SELECT = {
    id: true, name: true, email: true, role: true,
    tenantId: true, isActive: true, phone: true,
    jobTitle: true, avatarUrl: true, createdAt: true, updatedAt: true,
};
let UsersService = class UsersService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.bcryptRounds = parseInt(config.get('BCRYPT_ROUNDS', '12'), 10);
    }
    async findAll(tenantId, dto) {
        const { page = 1, limit = 20, search } = dto;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            } : {}),
        };
        const [users, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({ where, skip, take: limit, select: SELECT, orderBy: { createdAt: 'desc' } }),
            this.prisma.user.count({ where }),
        ]);
        return (0, pagination_dto_1.paginate)(users, total, page, limit);
    }
    async findOne(id, tenantId) {
        const user = await this.prisma.user.findFirst({
            where: { id, tenantId },
            select: SELECT,
        });
        if (!user)
            throw new common_1.NotFoundException(`User #${id} not found`);
        return user;
    }
    async getMe(userId) {
        return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: SELECT });
    }
    async create(tenantId, dto, createdBy) {
        const tenant = await this.prisma.tenant.findUniqueOrThrow({
            where: { id: tenantId },
            select: { maxUsers: true },
        });
        const count = await this.prisma.user.count({ where: { tenantId, isActive: true } });
        if (count >= tenant.maxUsers) {
            throw new common_1.BadRequestException(`Your plan allows a maximum of ${tenant.maxUsers} users. Please upgrade to add more.`);
        }
        const exists = await this.prisma.user.findFirst({
            where: { tenantId, email: dto.email.toLowerCase() },
            select: { id: true },
        });
        if (exists)
            throw new common_1.ConflictException('Email already registered in this workspace');
        const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);
        return this.prisma.withTenantContext(tenantId, createdBy, async (tx) => {
            const user = await tx.user.create({
                data: {
                    tenantId,
                    name: dto.name,
                    email: dto.email.toLowerCase(),
                    passwordHash,
                    role: dto.role,
                    phone: dto.phone,
                    jobTitle: dto.jobTitle,
                    createdBy,
                },
                select: SELECT,
            });
            await tx.userSettings.create({ data: { userId: user.id } });
            await tx.auditLog.create({
                data: {
                    tenantId,
                    userId: createdBy,
                    action: 'CREATE',
                    module: 'users',
                    entityType: 'user',
                    entityId: user.id,
                    after: { name: dto.name, email: dto.email, role: dto.role },
                },
            });
            return user;
        });
    }
    async updateMe(userId, tenantId, dto) {
        if (dto.password) {
            if (!dto.currentPassword) {
                throw new common_1.BadRequestException('Current password is required to set a new password');
            }
            const self = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
            const valid = await bcrypt.compare(dto.currentPassword, self.passwordHash);
            if (!valid)
                throw new common_1.BadRequestException('Current password is incorrect');
        }
        return this.update(userId, tenantId, userId, dto);
    }
    async update(id, tenantId, requesterId, dto) {
        await this.findOne(id, tenantId);
        if (dto.email) {
            const conflict = await this.prisma.user.findFirst({
                where: { tenantId, email: dto.email.toLowerCase(), id: { not: id } },
                select: { id: true },
            });
            if (conflict)
                throw new common_1.ConflictException('Email already in use');
        }
        let passwordHash;
        if (dto.password) {
            passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);
        }
        return this.prisma.withTenantContext(tenantId, requesterId, async (tx) => {
            const data = {
                ...(dto.name ? { name: dto.name } : {}),
                ...(dto.email ? { email: dto.email.toLowerCase() } : {}),
                ...(dto.phone ? { phone: dto.phone } : {}),
                ...(dto.jobTitle ? { jobTitle: dto.jobTitle } : {}),
                ...(passwordHash ? { passwordHash } : {}),
            };
            const updated = await tx.user.update({ where: { id }, data, select: SELECT });
            await tx.auditLog.create({
                data: {
                    tenantId,
                    userId: requesterId,
                    action: 'UPDATE',
                    module: 'users',
                    entityType: 'user',
                    entityId: id,
                    after: { ...dto, password: undefined },
                },
            });
            return updated;
        });
    }
    async deactivate(id, tenantId, requesterId) {
        if (id === requesterId)
            throw new common_1.ForbiddenException('You cannot deactivate your own account');
        await this.findOne(id, tenantId);
        return this.prisma.withTenantContext(tenantId, requesterId, async (tx) => {
            const updated = await tx.user.update({ where: { id }, data: { isActive: false }, select: SELECT });
            await tx.auditLog.create({
                data: {
                    tenantId,
                    userId: requesterId,
                    action: 'DEACTIVATE',
                    module: 'users',
                    entityType: 'user',
                    entityId: id,
                },
            });
            return updated;
        });
    }
    async activate(id, tenantId, requesterId) {
        await this.findOne(id, tenantId);
        return this.prisma.withTenantContext(tenantId, requesterId, async (tx) => {
            const updated = await tx.user.update({ where: { id }, data: { isActive: true }, select: SELECT });
            await tx.auditLog.create({
                data: {
                    tenantId,
                    userId: requesterId,
                    action: 'ACTIVATE',
                    module: 'users',
                    entityType: 'user',
                    entityId: id,
                },
            });
            return updated;
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], UsersService);
//# sourceMappingURL=users.service.js.map