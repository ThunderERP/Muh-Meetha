"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const products_module_1 = require("./modules/products/products.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const stock_movements_module_1 = require("./modules/stock-movements/stock-movements.module");
const suppliers_module_1 = require("./modules/suppliers/suppliers.module");
const audit_logs_module_1 = require("./modules/audit-logs/audit-logs.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const settings_module_1 = require("./modules/settings/settings.module");
const request_id_middleware_1 = require("./common/middleware/request-id.middleware");
const tenant_context_middleware_1 = require("./common/middleware/tenant-context.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(request_id_middleware_1.RequestIdMiddleware, tenant_context_middleware_1.TenantContextMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'global',
                    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
                    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
                },
            ]),
            event_emitter_1.EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            tenants_module_1.TenantsModule,
            products_module_1.ProductsModule,
            inventory_module_1.InventoryModule,
            stock_movements_module_1.StockMovementsModule,
            suppliers_module_1.SuppliersModule,
            audit_logs_module_1.AuditLogsModule,
            uploads_module_1.UploadsModule,
            notifications_module_1.NotificationsModule,
            settings_module_1.SettingsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map