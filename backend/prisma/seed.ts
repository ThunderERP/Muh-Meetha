/**
 * ThunderERP Prisma Seed
 * Run: npx ts-node prisma/seed.ts
 *
 * This is the TypeScript equivalent of migration 006.
 * Use EITHER the SQL seed OR this script — not both.
 */

import { PrismaClient, Role, TenantPlan } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ThunderERP demo data...');

  const BCRYPT_ROUNDS = 12;

  // ─── Tenant ─────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where:  { slug: 'demo-corp' },
    update: {},
    create: {
      slug:             'demo-corp',
      name:             'Demo Corporation',
      legalName:        'Demo Corporation Pvt Ltd',
      plan:             TenantPlan.GROWTH,
      isActive:         true,
      maxUsers:         20,
      storageQuotaMb:   2000,
      phone:            '+91 98765 43210',
      email:            'admin@democorp.in',
      gstin:            '27AADCD1234F1Z5',
      industry:         'Manufacturing',
      country:          'India',
      state:            'Maharashtra',
      city:             'Mumbai',
      pincode:          '400001',
      address:          '1st Floor, Business Tower, Nariman Point, Mumbai',
      timezone:         'Asia/Kolkata',
      currency:         'INR',
      isEmailVerified:  true,
      tosAcceptedAt:    new Date(),
    },
  });
  console.log(`  ✓ Tenant: ${tenant.name} (${tenant.slug})`);

  // ─── Admin User ───────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@1234', BCRYPT_ROUNDS);
  const admin = await prisma.user.upsert({
    where:  { tenantId_email: { tenantId: tenant.id, email: 'admin@democorp.in' } },
    update: {},
    create: {
      tenantId:     tenant.id,
      name:         'Rahul Sharma',
      email:        'admin@democorp.in',
      passwordHash: adminHash,
      role:         Role.BUSINESS_OWNER,
      isActive:     true,
      phone:        '+91 98765 43210',
      jobTitle:     'Managing Director',
      createdBy:    0,
    },
  });

  await prisma.userSettings.upsert({
    where:  { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  // ─── Inventory Manager ────────────────────────────────────────────────────
  const staffHash = await bcrypt.hash('Staff@1234', BCRYPT_ROUNDS);
  const invManager = await prisma.user.upsert({
    where:  { tenantId_email: { tenantId: tenant.id, email: 'inventory@democorp.in' } },
    update: {},
    create: {
      tenantId:     tenant.id,
      name:         'Priya Patel',
      email:        'inventory@democorp.in',
      passwordHash: staffHash,
      role:         Role.INVENTORY_MANAGER,
      isActive:     true,
      phone:        '+91 91234 56789',
      jobTitle:     'Inventory Manager',
      createdBy:    admin.id,
    },
  });

  await prisma.userSettings.upsert({
    where:  { userId: invManager.id },
    update: {},
    create: { userId: invManager.id },
  });
  console.log('  ✓ Users created (admin + inventory manager)');

  // ─── Company Module ───────────────────────────────────────────────────────
  await prisma.companyModule.upsert({
    where:  { tenantId_moduleKey: { tenantId: tenant.id, moduleKey: 'INVENTORY' } },
    update: {},
    create: {
      tenantId:    tenant.id,
      moduleKey:   'INVENTORY',
      status:      'ACTIVE',
      activatedAt: new Date(),
    },
  });

  // ─── Subscription ─────────────────────────────────────────────────────────
  const existing = await prisma.subscription.findFirst({ where: { tenantId: tenant.id } });
  if (!existing) {
    await prisma.subscription.create({
      data: { tenantId: tenant.id, plan: 'GROWTH', startsAt: new Date(), isActive: true, maxUsers: 20, storageMb: 2000 },
    });
  }

  // ─── Suppliers ────────────────────────────────────────────────────────────
  const suppliersData = [
    { name: 'ABC Electronics Pvt Ltd',    code: 'SUP-001', phone: '+91 22 4567 8901', email: 'purchase@abcelectronics.in',  city: 'Mumbai',    gstin: '27AABCA1234A1Z5' },
    { name: 'XYZ Components Co',           code: 'SUP-002', phone: '+91 80 2345 6789', email: 'sales@xyzcomponents.com',     city: 'Bengaluru', gstin: '29AABCX5678B1Z2' },
    { name: 'National Traders',            code: 'SUP-003', phone: '+91 11 3456 7890', email: 'info@nationaltraders.in',     city: 'New Delhi', gstin: '07AAACN9012C1Z8' },
    { name: 'Sunshine Packaging Ltd',      code: 'SUP-004', phone: '+91 79 4567 8901', email: 'orders@sunshinepack.com',     city: 'Ahmedabad', gstin: '24AAACS3456D1Z3' },
    { name: 'Precision Parts Industries',  code: 'SUP-005', phone: '+91 20 5678 9012', email: 'supply@precisionparts.in',    city: 'Pune',      gstin: '27AAECP7890E1Z9' },
  ];

  for (const s of suppliersData) {
    await prisma.supplier.upsert({
      where:  { id: (await prisma.supplier.findFirst({ where: { tenantId: tenant.id, code: s.code } }))?.id ?? 0 },
      update: {},
      create: { tenantId: tenant.id, ...s, isActive: true, createdBy: admin.id },
    }).catch(() => {}); // ignore if no id=0
    await prisma.supplier.create({
      data: { tenantId: tenant.id, ...s, isActive: true, createdBy: admin.id },
    }).catch(() => {}); // ignore duplicates
  }
  console.log('  ✓ Suppliers created');

  // ─── Products + Inventory ─────────────────────────────────────────────────
  const productsData = [
    { name: 'Industrial HDMI Cable 2m',    sku: 'ELE-001', category: 'Electronics', price: 349,   gstPct: 18, stock: 145, reorder: 20 },
    { name: 'USB-C Hub 7-in-1',            sku: 'ELE-002', category: 'Electronics', price: 1299,  gstPct: 18, stock: 38,  reorder: 20 },
    { name: 'Wireless Mouse',              sku: 'ELE-003', category: 'Electronics', price: 799,   gstPct: 18, stock: 72,  reorder: 20 },
    { name: 'Mechanical Keyboard',         sku: 'ELE-004', category: 'Electronics', price: 2499,  gstPct: 18, stock: 15,  reorder: 20 },
    { name: 'Monitor Stand Adjustable',    sku: 'FUR-001', category: 'Furniture',   price: 1899,  gstPct: 18, stock: 8,   reorder: 5  },
    { name: 'Ergonomic Office Chair',      sku: 'FUR-002', category: 'Furniture',   price: 8999,  gstPct: 18, stock: 3,   reorder: 5  },
    { name: 'A4 Paper Ream 500 Sheets',    sku: 'STA-001', category: 'Stationery', price: 249,   gstPct: 12, stock: 220, reorder: 50 },
    { name: 'Ballpoint Pen Box of 10',     sku: 'STA-002', category: 'Stationery', price: 89,    gstPct: 12, stock: 180, reorder: 50 },
    { name: 'Cardboard Box 12x10x8 inch',  sku: 'PKG-001', category: 'Packaging',  price: 35,    gstPct: 12, stock: 500, reorder: 30 },
    { name: 'Safety Helmet ISI Mark',      sku: 'SAF-001', category: 'Safety',     price: 299,   gstPct: 18, stock: 5,   reorder: 10 },
    { name: 'AA Alkaline Batteries Pack',  sku: 'ELE-005', category: 'Electronics', price: 149,   gstPct: 18, stock: 110, reorder: 20 },
    { name: 'Label Printer Rolls 50mm',    sku: 'STA-005', category: 'Stationery', price: 349,   gstPct: 12, stock: 0,   reorder: 10 },
  ];

  for (const p of productsData) {
    const existing = await prisma.product.findFirst({
      where: { tenantId: tenant.id, sku: p.sku },
    });
    if (existing) continue;

    const product = await prisma.product.create({
      data: {
        tenantId:      tenant.id,
        name:          p.name,
        sku:           p.sku,
        category:      p.category,
        unit:          'Piece',
        price:         p.price,
        gstPercentage: p.gstPct,
        isActive:      true,
        createdBy:     admin.id,
        updatedBy:     admin.id,
      },
    });

    await prisma.inventory.create({
      data: {
        productId:    product.id,
        availableQty: p.stock,
        reservedQty:  0,
        reorderLevel: p.reorder,
      },
    });

    if (p.stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId:     product.id,
          type:          'INWARD',
          quantity:      p.stock,
          stockBefore:   0,
          stockAfter:    p.stock,
          referenceType: 'OPENING_STOCK',
          notes:         'Opening stock entry',
          createdBy:     admin.id,
        },
      });
    }
  }
  console.log('  ✓ Products + inventory + opening stock movements created');

  // ─── Terms Acceptance ─────────────────────────────────────────────────────
  await prisma.termsAcceptance.createMany({
    data: [
      { userId: admin.id, tenantId: tenant.id, version: 'tos-v1.0',     ipAddress: '127.0.0.1' },
      { userId: admin.id, tenantId: tenant.id, version: 'privacy-v1.0', ipAddress: '127.0.0.1' },
    ],
    skipDuplicates: true,
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ✓ ThunderERP seed complete!');
  console.log('');
  console.log('  Demo credentials:');
  console.log('    Company ID : demo-corp');
  console.log('    Admin      : admin@democorp.in / Admin@1234');
  console.log('    Inv Mgr    : inventory@democorp.in / Staff@1234');
  console.log('═══════════════════════════════════════════════════════');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
