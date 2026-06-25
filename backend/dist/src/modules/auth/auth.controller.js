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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const auth_dto_1 = require("./dto/auth.dto");
const auth_decorators_1 = require("../../common/decorators/auth.decorators");
const auth_decorators_2 = require("../../common/decorators/auth.decorators");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    loginTenant(dto, req) {
        return this.authService.loginByTenant(dto, req.ip);
    }
    registerTenant(dto, req) {
        return this.authService.registerOrganisation(dto, req.ip, req.headers['user-agent']);
    }
    me(user) {
        return this.authService.getMe(user.id, user.tenantId);
    }
    changePassword(user, dto, req) {
        return this.authService.changePassword(user.id, dto, req.ip);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, auth_decorators_2.Public)(),
    (0, common_1.Post)('login-tenant'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60_000, limit: 10 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Login with company slug + email + password' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginTenantDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "loginTenant", null);
__decorate([
    (0, auth_decorators_2.Public)(),
    (0, common_1.Post)('register-tenant'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, throttler_1.Throttle)({ default: { ttl: 3_600_000, limit: 5 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new company and admin account' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterTenantDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "registerTenant", null);
__decorate([
    (0, common_1.UseGuards)(auth_decorators_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user and tenant profile' }),
    __param(0, (0, auth_decorators_2.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.UseGuards)(auth_decorators_1.JwtAuthGuard),
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, throttler_1.Throttle)({ default: { ttl: 60_000, limit: 5 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Change current user password' }),
    __param(0, (0, auth_decorators_2.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.ChangePasswordDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "changePassword", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map