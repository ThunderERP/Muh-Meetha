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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../prisma/prisma.service");
const USER_SELECT = {
    id: true, name: true, email: true, role: true,
    tenantId: true, isActive: true, phone: true,
    jobTitle: true, avatarUrl: true, createdAt: true,
};
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwt, config, events) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.events = events;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.bcryptRounds = parseInt(config.get('BCRYPT_ROUNDS', '12'), 10);
    }
    async loginByTenant(dto, ip) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug: dto.tenantSlug },
            select: { id: true, slug: true, name: true, plan: true, isActive: true,
                maxUsers: true, storageQuotaMb: true, timezone: true, currency: true,
                industry: true, phone: true, website: true, gstin: true,
                country: true, isEmailVerified: true },
        });
        if (!tenant || !tenant.isActive) {
            throw new common_1.UnauthorizedException('Company not found or inactive');
        }
        const user = await this.prisma.user.findFirst({
            where: { tenantId: tenant.id, email: dto.email.toLowerCase(), isActive: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date(), lastLoginIp: ip },
        });
        const accessToken = this.signToken(user.id, user.email, user.role, tenant.id);
        this.events.emit('auth.login', { userId: user.id, tenantId: tenant.id, ip });
        const { passwordHash: _, ...safeUser } = user;
        return { accessToken, user: safeUser, tenant };
    }
    async registerOrganisation(dto, ip, userAgent) {
        if (!dto.tosAccepted || !dto.privacyAccepted) {
            throw new common_1.BadRequestException('You must accept the Terms of Service and Privacy Policy to register.');
        }
        const slugExists = await this.prisma.tenant.findUnique({
            where: { slug: dto.slug },
            select: { id: true },
        });
        if (slugExists) {
            throw new common_1.ConflictException(`Workspace ID "${dto.slug}" is already taken. Please choose another.`);
        }
        const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);
        return this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    slug: dto.slug,
                    name: dto.companyName,
                    plan: 'STARTER',
                    industry: dto.industry,
                    phone: dto.phone,
                    email: dto.adminEmail,
                    website: dto.website,
                    gstin: dto.gstin,
                    tosAcceptedAt: new Date(),
                    tosAcceptedIp: ip,
                },
            });
            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    name: dto.adminName,
                    email: dto.adminEmail.toLowerCase(),
                    passwordHash,
                    role: 'BUSINESS_OWNER',
                    jobTitle: dto.jobTitle,
                    phone: dto.phone,
                    lastLoginAt: new Date(),
                    lastLoginIp: ip,
                    createdBy: 0,
                },
            });
            await tx.userSettings.create({ data: { userId: user.id } });
            await tx.companyModule.create({
                data: {
                    tenantId: tenant.id,
                    moduleKey: 'INVENTORY',
                    status: 'ACTIVE',
                    activatedAt: new Date(),
                },
            });
            await tx.termsAcceptance.createMany({
                data: [
                    { userId: user.id, tenantId: tenant.id, version: 'tos-v1.0', ipAddress: ip, userAgent },
                    { userId: user.id, tenantId: tenant.id, version: 'privacy-v1.0', ipAddress: ip, userAgent },
                ],
            });
            await tx.subscription.create({
                data: {
                    tenantId: tenant.id,
                    plan: 'STARTER',
                    startsAt: new Date(),
                    isActive: true,
                    maxUsers: 10,
                    storageMb: 500,
                },
            });
            await tx.auditLog.create({
                data: {
                    tenantId: tenant.id,
                    userId: user.id,
                    action: 'CREATE',
                    module: 'auth',
                    entityType: 'tenant',
                    entityId: tenant.id,
                    after: { slug: tenant.slug, name: tenant.name },
                    ipAddress: ip,
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
    async getMe(userId, tenantId) {
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
    async changePassword(userId, dto, ip) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!valid)
            throw new common_1.BadRequestException('Current password is incorrect');
        const hash = await bcrypt.hash(dto.newPassword, this.bcryptRounds);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hash, updatedAt: new Date() },
        });
        await this.prisma.auditLog.create({
            data: {
                tenantId: user.tenantId,
                userId: user.id,
                action: 'UPDATE',
                module: 'auth',
                entityType: 'user',
                entityId: user.id,
                after: { passwordChanged: true },
                ipAddress: ip,
            },
        });
        return { message: 'Password changed successfully' };
    }
    signToken(userId, email, role, tenantId) {
        const payload = { sub: userId, email, role, tenantId };
        return this.jwt.sign(payload);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        event_emitter_1.EventEmitter2])
], AuthService);
//# sourceMappingURL=auth.service.js.map