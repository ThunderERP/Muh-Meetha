import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';
import { CreateProductDto, UpdateProductDto, ProductFiltersDto } from './dto/products.dto';

const PRODUCT_SELECT = {
  id: true, tenantId: true, name: true, sku: true, barcode: true,
  category: true, subcategory: true, brand: true, unit: true, hsn: true,
  price: true, purchasePrice: true, gstPercentage: true, discountPercentage: true,
  description: true, expiryDate: true, manufacturingDate: true,
  imageUrl: true, isActive: true, createdAt: true, updatedAt: true, createdBy: true,
  inventory: true,
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  // ─── Reads (no tenant context needed — tenantId in WHERE is sufficient) ──────

  async findAll(tenantId: number, filters: ProductFiltersDto) {
    const { page = 1, limit = 20, search, category, status, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
      ...(search ? {
        OR: [
          { name:     { contains: search, mode: 'insensitive' as const } },
          { sku:      { contains: search, mode: 'insensitive' as const } },
          { category: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
      ...(category ? { category: { equals: category, mode: 'insensitive' as const } } : {}),
      ...(status === 'inactive'     ? { isActive: false }                                           : {}),
      ...(status === 'active'       ? { isActive: true }                                            : {}),
      ...(status === 'out_of_stock' ? { inventory: { availableQty: { equals: 0 } } }               : {}),
    };

    const [rawProducts, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: where as any,
        skip: status === 'low_stock' ? 0 : skip,
        take: status === 'low_stock' ? 10000 : limit,
        include: { inventory: true },
        orderBy: { [sortBy as string]: sortOrder } as Record<string, string>,
      }),
      this.prisma.product.count({ where: where as any }),
    ]);

    let products = rawProducts;
    let adjustedTotal = total;
    if (status === 'low_stock') {
      products = rawProducts.filter(
        (p) =>
          (p.inventory?.availableQty ?? 0) > 0 &&
          (p.inventory?.availableQty ?? 0) <= (p.inventory?.reorderLevel ?? 10),
      );
      adjustedTotal = products.length;
      products = products.slice(skip, skip + limit);
    }

    return paginate(products, adjustedTotal, page, limit);
  }

  async findOne(id: number, tenantId: number) {
    const p = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { inventory: true },
    });
    if (!p) throw new NotFoundException(`Product #${id} not found`);
    return p;
  }

  // ─── Writes (all wrapped in withTenantContext to activate RLS policies) ──────

  async create(tenantId: number, userId: number, dto: CreateProductDto) {
    // SKU uniqueness check — read-only, no RLS context needed
    if (dto.sku) {
      const exists = await this.prisma.product.findFirst({
        where: { tenantId, sku: dto.sku, deletedAt: null },
        select: { id: true },
      });
      if (exists) throw new ConflictException(`SKU "${dto.sku}" already exists`);
    }

    const product = await this.prisma.withTenantContext(tenantId, userId, async (tx) => {
      const p = await tx.product.create({
        data: {
          tenantId,
          name:               dto.name,
          sku:                dto.sku,
          barcode:            dto.barcode,
          category:           dto.category,
          subcategory:        dto.subcategory,
          brand:              dto.brand,
          unit:               dto.unit || 'Piece',
          hsn:                dto.hsn,
          price:              dto.price,
          purchasePrice:      dto.purchasePrice,
          gstPercentage:      dto.gstPercentage  ?? 18,
          discountPercentage: dto.discountPercentage ?? 0,
          description:        dto.description,
          expiryDate:         dto.expiryDate        ? new Date(dto.expiryDate)        : undefined,
          manufacturingDate:  dto.manufacturingDate  ? new Date(dto.manufacturingDate) : undefined,
          imageUrl:           dto.imageUrl,
          createdBy:          userId,
          updatedBy:          userId,
        },
        include: { inventory: true },
      });

      await tx.inventory.create({
        data: {
          productId:    p.id,
          availableQty: 0,
          reservedQty:  0,
          reorderLevel: dto.reorderLevel ?? 10,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action:     'CREATE',
          module:     'inventory',
          entityType: 'product',
          entityId:   p.id,
          after:      dto as any,
        },
      });

      return p;
    });

    this.events.emit('inventory.product.created', { tenantId, productId: product.id, userId });
    return this.findOne(product.id, tenantId);
  }

  async update(id: number, tenantId: number, userId: number, dto: UpdateProductDto) {
    const existing = await this.findOne(id, tenantId);

    if (dto.sku && dto.sku !== existing.sku) {
      const conflict = await this.prisma.product.findFirst({
        where: { tenantId, sku: dto.sku, deletedAt: null, id: { not: id } },
        select: { id: true },
      });
      if (conflict) throw new ConflictException(`SKU "${dto.sku}" already exists`);
    }

    const updated = await this.prisma.withTenantContext(tenantId, userId, async (tx) => {
      const p = await tx.product.update({
        where: { id },
        data: {
          ...dto,
          expiryDate:        dto.expiryDate        ? new Date(dto.expiryDate)        : undefined,
          manufacturingDate: dto.manufacturingDate  ? new Date(dto.manufacturingDate) : undefined,
          updatedBy: userId,
        },
        include: { inventory: true },
      });

      if (dto.reorderLevel !== undefined) {
        await tx.inventory.update({
          where: { productId: id },
          data:  { reorderLevel: dto.reorderLevel },
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action:     'UPDATE',
          module:     'inventory',
          entityType: 'product',
          entityId:   id,
          before:     existing as any,
          after:      dto as any,
        },
      });

      return p;
    });

    this.events.emit('inventory.product.updated', { tenantId, productId: id, userId });
    return updated;
  }

  async delete(id: number, tenantId: number, userId: number) {
    const existing = await this.findOne(id, tenantId);
    const stock = existing.inventory?.availableQty ?? 0;
    if (stock > 0) {
      throw new BadRequestException(
        `Cannot delete product with ${stock} units in stock. Clear stock first.`,
      );
    }

    await this.prisma.withTenantContext(tenantId, userId, async (tx) => {
      await tx.product.update({
        where: { id },
        data:  { deletedAt: new Date(), isActive: false, updatedBy: userId },
      });
      await tx.auditLog.create({
        data: {
          tenantId, userId,
          action: 'DELETE', module: 'inventory', entityType: 'product', entityId: id,
          before: existing as any,
        },
      });
    });

    this.events.emit('inventory.product.deleted', { tenantId, productId: id, userId });
    return { message: 'Product deleted successfully' };
  }

  // ─── Reads ────────────────────────────────────────────────────────────────────

  async getCategories(tenantId: number): Promise<string[]> {
    const rows = await this.prisma.product.findMany({
      where: { tenantId, deletedAt: null, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return rows.map((r) => r.category!).filter(Boolean);
  }

  async getDashboardStats(tenantId: number) {
    const [totalProducts, outOfStock, categories] = await this.prisma.$transaction([
      this.prisma.product.count({ where: { tenantId, deletedAt: null, isActive: true } }),
      this.prisma.inventory.count({
        where: {
          product: { tenantId, deletedAt: null, isActive: true },
          availableQty: 0,
        },
      }),
      this.prisma.product.groupBy({
        by: ['category'],
        where: { tenantId, deletedAt: null, isActive: true },
        _count: true,
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    const allInventory = await this.prisma.product.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      include: { inventory: true },
    });

    let inventoryValue = 0;
    let actualLowStock = 0;
    const stockAlerts: typeof allInventory = [];

    for (const p of allInventory) {
      const qty     = p.inventory?.availableQty ?? 0;
      const reorder = p.inventory?.reorderLevel  ?? 10;
      inventoryValue += qty * Number(p.price);
      if (qty > 0 && qty <= reorder) {
        actualLowStock++;
        stockAlerts.push(p);
      }
    }

    const recentMovements = await this.prisma.stockMovement.findMany({
      where: { product: { tenantId } },
      include: { product: { select: { id: true, name: true, sku: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMovements = await this.prisma.stockMovement.count({
      where: { product: { tenantId }, createdAt: { gte: today } },
    });

    return {
      totalProducts,
      totalCategories:     categories.length,
      lowStockCount:       actualLowStock,
      outOfStockCount:     outOfStock,
      inventoryValue:      Math.round(inventoryValue * 100) / 100,
      totalMovementsToday: todayMovements,
      recentMovements,
      topCategories: categories.map((c) => ({
        category: c.category ?? 'Uncategorised',
        count:    c._count,
        value:    0,
      })),
      stockAlerts: stockAlerts.slice(0, 20),
    };
  }

  async exportCsv(tenantId: number): Promise<string> {
    const products = await this.prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: { inventory: true },
      orderBy: { name: 'asc' },
    });

    const header = [
      'Name', 'SKU', 'Barcode', 'Category', 'Unit', 'Selling Price (₹)',
      'Purchase Price (₹)', 'GST %', 'Discount %', 'Stock', 'Reorder Level',
      'HSN', 'Description', 'Status',
    ].join(',');

    const rows = products.map((p) => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.sku || '',
      p.barcode || '',
      p.category || '',
      p.unit,
      Number(p.price).toFixed(2),
      p.purchasePrice ? Number(p.purchasePrice).toFixed(2) : '',
      Number(p.gstPercentage),
      Number(p.discountPercentage),
      p.inventory?.availableQty ?? 0,
      p.inventory?.reorderLevel  ?? 10,
      p.hsn || '',
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.isActive ? 'Active' : 'Inactive',
    ].join(','));

    return [header, ...rows].join('\n');
  }
}
