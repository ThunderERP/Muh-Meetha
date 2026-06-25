-- ThunderERP Migration 006: Development Seed Data
-- Creates one demo tenant, admin user, and sample inventory data.
-- DO NOT run in production. Gate with: \if :'ENV' = 'development'

-- ─── DEMO TENANT ─────────────────────────────────────────────────────────────

INSERT INTO tenants (
  slug, name, legal_name, plan, is_active, max_users, storage_quota_mb,
  phone, email, gstin, industry, country, state, city, pincode, address,
  timezone, currency, is_email_verified, tos_accepted_at
) VALUES (
  'demo-corp',
  'Demo Corporation',
  'Demo Corporation Pvt Ltd',
  'GROWTH',
  TRUE, 20, 2000,
  '+91 98765 43210',
  'admin@democorp.in',
  '27AADCD1234F1Z5',
  'Manufacturing',
  'India', 'Maharashtra', 'Mumbai', '400001',
  '1st Floor, Business Tower, Nariman Point, Mumbai',
  'Asia/Kolkata', 'INR', TRUE, NOW()
);

-- ─── DEMO ADMIN USER ─────────────────────────────────────────────────────────
-- Password: Admin@1234 (bcrypt hash)

INSERT INTO users (
  tenant_id, name, email, password_hash, role, is_active, phone, job_title
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'demo-corp'),
  'Rahul Sharma',
  'admin@democorp.in',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGkv8yS.FSJJ0B3GEkHQqS5K8Vy',
  'BUSINESS_OWNER',
  TRUE,
  '+91 98765 43210',
  'Managing Director'
);

-- ─── DEMO USER SETTINGS ───────────────────────────────────────────────────────

INSERT INTO user_settings (user_id)
VALUES ((SELECT id FROM users WHERE email = 'admin@democorp.in'));

-- ─── DEMO INVENTORY MANAGER ───────────────────────────────────────────────────
-- Password: Staff@1234

INSERT INTO users (
  tenant_id, name, email, password_hash, role, is_active, phone, job_title
) VALUES (
  (SELECT id FROM tenants WHERE slug = 'demo-corp'),
  'Priya Patel',
  'inventory@democorp.in',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGkv8yS.FSJJ0B3GEkHQqS5K8Vy',
  'INVENTORY_MANAGER',
  TRUE,
  '+91 91234 56789',
  'Inventory Manager'
);

INSERT INTO user_settings (user_id)
VALUES ((SELECT id FROM users WHERE email = 'inventory@democorp.in'));

-- ─── ACTIVATE INVENTORY MODULE ────────────────────────────────────────────────

INSERT INTO company_modules (tenant_id, module_key, status, activated_at)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'demo-corp'),
  'INVENTORY',
  'ACTIVE',
  NOW()
);

-- ─── DEMO SUPPLIERS ───────────────────────────────────────────────────────────

INSERT INTO suppliers (tenant_id, name, code, phone, email, address, city, state, gstin, is_active, created_by)
SELECT
  t.id,
  s.name, s.code, s.phone, s.email, s.address, s.city, s.state, s.gstin, TRUE,
  u.id
FROM tenants t
CROSS JOIN (VALUES
  ('ABC Electronics Pvt Ltd',   'SUP-001', '+91 22 4567 8901', 'purchase@abcelectronics.in', '42 Industrial Area, Andheri East', 'Mumbai',    'Maharashtra', '27AABCA1234A1Z5'),
  ('XYZ Components Co',          'SUP-002', '+91 80 2345 6789', 'sales@xyzcomponents.com',    '15 Electronic City Phase 1',      'Bengaluru',  'Karnataka',   '29AABCX5678B1Z2'),
  ('National Traders',           'SUP-003', '+91 11 3456 7890', 'info@nationaltraders.in',    '8 Nehru Place',                   'New Delhi',  'Delhi',       '07AAACN9012C1Z8'),
  ('Sunshine Packaging Ltd',     'SUP-004', '+91 79 4567 8901', 'orders@sunshinepack.com',    '23 GIDC Estate, Vatva',           'Ahmedabad',  'Gujarat',     '24AAACS3456D1Z3'),
  ('Precision Parts Industries', 'SUP-005', '+91 20 5678 9012', 'supply@precisionparts.in',   '56 Bhosari Industrial Area',      'Pune',       'Maharashtra', '27AAECP7890E1Z9')
) AS s(name, code, phone, email, address, city, state, gstin)
CROSS JOIN users u
WHERE t.slug = 'demo-corp' AND u.email = 'admin@democorp.in';

-- ─── DEMO PRODUCTS ────────────────────────────────────────────────────────────

WITH t AS (SELECT id FROM tenants WHERE slug = 'demo-corp'),
     u AS (SELECT id FROM users WHERE email = 'admin@democorp.in')
INSERT INTO products (
  tenant_id, name, sku, category, unit, price, purchase_price,
  gst_percentage, discount_percentage, description, is_active, created_by
)
SELECT
  t.id, p.name, p.sku, p.category, p.unit,
  p.price, p.purchase_price, p.gst_pct, p.disc_pct,
  p.description, TRUE, u.id
FROM t, u,
(VALUES
  ('Industrial HDMI Cable 2m',     'ELE-001', 'Electronics',  'Piece',  349.00,  180.00, 18, 0,  'High-speed HDMI 2.0 cable, 2 metre'),
  ('USB-C Hub 7-in-1',             'ELE-002', 'Electronics',  'Piece',  1299.00, 750.00, 18, 5,  '7-port USB-C hub with HDMI and SD card reader'),
  ('Wireless Mouse',               'ELE-003', 'Electronics',  'Piece',  799.00,  420.00, 18, 0,  '2.4GHz wireless mouse, ergonomic design'),
  ('Mechanical Keyboard',          'ELE-004', 'Electronics',  'Piece',  2499.00, 1400.00,18, 10, 'TKL mechanical keyboard, blue switches'),
  ('Monitor Stand Adjustable',     'FUR-001', 'Furniture',    'Piece',  1899.00, 950.00, 18, 0,  'Height-adjustable aluminium monitor stand'),
  ('Ergonomic Office Chair',       'FUR-002', 'Furniture',    'Piece',  8999.00, 5000.00,18, 5,  'Lumbar support mesh chair with armrests'),
  ('A4 Paper Ream 500 Sheets',     'STA-001', 'Stationery',   'Ream',   249.00,  140.00, 12, 0,  'ITC Classmate A4 copier paper 75 GSM'),
  ('Ballpoint Pen Box of 10',      'STA-002', 'Stationery',   'Box',    89.00,   45.00,  12, 0,  'Blue ink ballpoint pens, pack of 10'),
  ('Whiteboard Markers Set',       'STA-003', 'Stationery',   'Set',    299.00,  150.00, 12, 5,  '6-colour dry erase marker set'),
  ('Sticky Notes 100 Pack',        'STA-004', 'Stationery',   'Pack',   149.00,  70.00,  12, 0,  '3x3 inch yellow sticky notes'),
  ('Cardboard Box 12x10x8 inch',   'PKG-001', 'Packaging',    'Piece',  35.00,   18.00,  12, 0,  'Single-wall corrugated shipping box'),
  ('Bubble Wrap Roll 50m',         'PKG-002', 'Packaging',    'Roll',   799.00,  400.00, 18, 0,  '50 metre bubble wrap roll, 3/16 inch bubbles'),
  ('Packing Tape 48mm x 100m',     'PKG-003', 'Packaging',    'Roll',   129.00,  60.00,  18, 0,  'Brown BOPP packing tape'),
  ('Safety Helmet ISI Mark',       'SAF-001', 'Safety',       'Piece',  299.00,  160.00, 18, 0,  'HDPE construction safety helmet, ISI certified'),
  ('Safety Gloves (Pair)',         'SAF-002', 'Safety',       'Pair',   149.00,  75.00,  18, 0,  'Cut-resistant work gloves, size L'),
  ('Nitrile Examination Gloves',   'SAF-003', 'Safety',       'Box',    499.00,  280.00, 12, 0,  'Powder-free nitrile gloves, box of 100'),
  ('AA Alkaline Batteries Pack 4', 'ELE-005', 'Electronics',  'Pack',   149.00,  70.00,  18, 0,  'Long-life alkaline AA batteries, 4-pack'),
  ('Extension Cord 3m 4 Socket',   'ELE-006', 'Electronics',  'Piece',  399.00,  200.00, 18, 0,  'Surge-protected 4-socket extension cord, 3m'),
  ('Cable Ties 100 Pack',          'ELE-007', 'Electronics',  'Pack',   99.00,   45.00,  18, 0,  'Nylon cable ties 200mm x 3.6mm'),
  ('Label Printer Rolls 50mm',     'STA-005', 'Stationery',   'Roll',   349.00,  180.00, 12, 5,  'Compatible thermal label roll 50x30mm, 500 labels')
) AS p(name, sku, category, unit, price, purchase_price, gst_pct, disc_pct, description);

-- ─── DEMO INVENTORY (initial stock levels) ────────────────────────────────────

INSERT INTO inventory (product_id, available_qty, reserved_qty, reorder_level)
SELECT p.id,
  CASE p.sku
    WHEN 'ELE-001' THEN 145  WHEN 'ELE-002' THEN 38   WHEN 'ELE-003' THEN 72
    WHEN 'ELE-004' THEN 15   WHEN 'FUR-001' THEN 8    WHEN 'FUR-002' THEN 3
    WHEN 'STA-001' THEN 220  WHEN 'STA-002' THEN 180  WHEN 'STA-003' THEN 45
    WHEN 'STA-004' THEN 95   WHEN 'PKG-001' THEN 500  WHEN 'PKG-002' THEN 12
    WHEN 'PKG-003' THEN 68   WHEN 'SAF-001' THEN 5    WHEN 'SAF-002' THEN 28
    WHEN 'SAF-003' THEN 9    WHEN 'ELE-005' THEN 110  WHEN 'ELE-006' THEN 33
    WHEN 'ELE-007' THEN 250  WHEN 'STA-005' THEN 0
    ELSE 50
  END,
  0,
  CASE p.category
    WHEN 'Electronics' THEN 20
    WHEN 'Furniture'   THEN 5
    WHEN 'Stationery'  THEN 50
    WHEN 'Packaging'   THEN 30
    WHEN 'Safety'      THEN 10
    ELSE 15
  END
FROM products p
JOIN tenants t ON t.id = p.tenant_id
WHERE t.slug = 'demo-corp';

-- ─── INITIAL STOCK MOVEMENTS (opening entries) ────────────────────────────────

INSERT INTO stock_movements (
  product_id, type, quantity, stock_before, stock_after,
  reference_type, notes, created_by
)
SELECT
  inv.product_id,
  'INWARD',
  inv.available_qty,
  0,
  inv.available_qty,
  'OPENING_STOCK',
  'Opening stock entry',
  u.id
FROM inventory inv
JOIN products p ON p.id = inv.product_id
JOIN tenants t ON t.id = p.tenant_id
JOIN users u ON u.email = 'admin@democorp.in'
WHERE t.slug = 'demo-corp'
  AND inv.available_qty > 0;

-- ─── SUBSCRIPTION RECORD ──────────────────────────────────────────────────────

INSERT INTO subscriptions (tenant_id, plan, starts_at, is_active, max_users, storage_mb)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'demo-corp'),
  'GROWTH',
  NOW(),
  TRUE, 20, 2000
);

-- ─── TERMS ACCEPTANCE ────────────────────────────────────────────────────────

INSERT INTO terms_acceptances (user_id, tenant_id, version, ip_address)
SELECT u.id, t.id, v.version, '127.0.0.1'
FROM users u
JOIN tenants t ON t.id = u.tenant_id
CROSS JOIN (VALUES ('tos-v1.0'), ('privacy-v1.0')) AS v(version)
WHERE t.slug = 'demo-corp' AND u.email = 'admin@democorp.in';

-- ─── AUDIT LOG: Initial Setup ─────────────────────────────────────────────────

INSERT INTO audit_logs (tenant_id, user_id, action, module, entity_type, entity_id, after, ip_address)
SELECT
  t.id, u.id, 'CREATE', 'system', 'tenant', t.id,
  jsonb_build_object('slug', t.slug, 'name', t.name, 'plan', t.plan),
  '127.0.0.1'
FROM tenants t
JOIN users u ON u.tenant_id = t.id AND u.email = 'admin@democorp.in'
WHERE t.slug = 'demo-corp';
