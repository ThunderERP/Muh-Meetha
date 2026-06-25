import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ReorderAlertsController } from './reorder-alerts.controller';

@Module({
  imports: [ProductsModule],
  controllers: [InventoryController, ReorderAlertsController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
