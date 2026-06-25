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
exports.ReorderAlertsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_decorators_1 = require("../../common/decorators/auth.decorators");
const inventory_service_1 = require("./inventory.service");
let ReorderAlertsController = class ReorderAlertsController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    getReorderAlerts(u, page, limit) {
        return this.inventoryService.getReorderAlerts(u.tenantId, Number(page) || 1, Number(limit) || 25);
    }
};
exports.ReorderAlertsController = ReorderAlertsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get products at or below reorder level' }),
    __param(0, (0, auth_decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], ReorderAlertsController.prototype, "getReorderAlerts", null);
exports.ReorderAlertsController = ReorderAlertsController = __decorate([
    (0, swagger_1.ApiTags)('Reorder Alerts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(auth_decorators_1.JwtAuthGuard),
    (0, common_1.Controller)('reorder-alerts'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], ReorderAlertsController);
//# sourceMappingURL=reorder-alerts.controller.js.map