-- ThunderERP Migration 002: Inventory Module
-- Creates: products, inventory, stock_movements, suppliers
-- Plus: updated_at trigger function applied to all mutable tables

-- ─── updated_at Trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─── PRODUCTS ─────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id                   SERIAL PRIMARY KEY,
  tenant_id            INTEGER        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                 VARCHAR(255)   NOT NULL,
  sku                  VARCHAR(100),
  barcode              VARCHAR(100),
  category             VARCHAR(100),
  subcategory          VARCHAR(100),
  brand                VARCHAR(100),
  unit                 VARCHAR(50)    NOT NULL DEFAULT 'Piece',
  hsn                  VARCHAR(20),
  price                NUMERIC(12, 2) NOT NULL DEFAULT 0
    CONSTRAINT price_non_negative CHECK (price >= 0),
  purchase_price       NUMERIC(12, 2)
    CONSTRAINT purchase_price_non_negative CHECK (purchase_price >= 0),
  gst_percentage       NUMERIC(5, 2)  NOT NULL DEFAULT 18.00
    CONSTRAINT gst_valid CHECK (gst_percentage IN (0, 0.1, 0.25, 1, 1.5, 3, 5, 7.5, 12, 18, 28)),
  discount_percentage  NUMERIC(5, 2)  NOT NULL DEFAULT 0.00
    CONSTRAINT discount_valid CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  description          TEXT,
  expiry_date          TIMESTAMPTZ,
  manufacturing_date   TIMESTAMPTZ,
  image_url            VARCHAR(1000),
  is_active            BOOLEAN        NOT NULL DEFAULT TRUE,
  deleted_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_by           INTEGER        NOT NULL,
  updated_by           INTEGER
);

CREATE INDEX idx_products_tenant           ON products (tenant_id);
CREATE INDEX idx_products_tenant_category  ON products (tenant_id, category);
CREATE INDEX idx_products_tenant_sku       ON products (tenant_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_tenant_active    ON products (tenant_id, is_active);
CREATE INDEX idx_products_tenant_deleted   ON products (tenant_id, deleted_at) WHERE deleted_at IS NULL;
-- Full-text search index
CREATE INDEX idx_products_name_fts ON products USING GIN (to_tsvector('english', name));

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── INVENTORY ────────────────────────────────────────────────────────────────

CREATE TABLE inventory (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  available_qty INTEGER NOT NULL DEFAULT 0
    CONSTRAINT available_qty_non_negative CHECK (available_qty >= 0),
  reserved_qty  INTEGER NOT NULL DEFAULT 0
    CONSTRAINT reserved_qty_non_negative CHECK (reserved_qty >= 0),
  reorder_level INTEGER NOT NULL DEFAULT 10
    CONSTRAINT reorder_level_non_negative CHECK (reorder_level >= 0),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_product ON inventory (product_id);
CREATE INDEX idx_inventory_low_stock ON inventory (product_id, available_qty) WHERE available_qty <= reorder_level;

CREATE TRIGGER trg_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── STOCK MOVEMENTS ──────────────────────────────────────────────────────────

CREATE TABLE stock_movements (
  id             SERIAL PRIMARY KEY,
  product_id     INTEGER             NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  type           "StockMovementType" NOT NULL,
  quantity       INTEGER             NOT NULL
    CONSTRAINT qty_positive CHECK (quantity > 0),
  stock_before   INTEGER             NOT NULL,
  stock_after    INTEGER             NOT NULL,
  reference_type VARCHAR(60)         NOT NULL,
  reference_id   INTEGER,
  notes          TEXT,
  created_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  created_by     INTEGER             NOT NULL
);

-- Immutable: no UPDATE or DELETE permitted (enforced via RLS + trigger)
CREATE OR REPLACE FUNCTION prevent_stock_movement_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'stock_movements are immutable — no updates or deletes allowed';
END;
$$;

CREATE TRIGGER trg_stock_movements_immutable
  BEFORE UPDATE OR DELETE ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION prevent_stock_movement_mutation();

CREATE INDEX idx_stock_movements_product     ON stock_movements (product_id);
CREATE INDEX idx_stock_movements_product_time ON stock_movements (product_id, created_at DESC);
CREATE INDEX idx_stock_movements_reference   ON stock_movements (reference_type, reference_id);
CREATE INDEX idx_stock_movements_type        ON stock_movements (product_id, type);

-- ─── SUPPLIERS ────────────────────────────────────────────────────────────────

CREATE TABLE suppliers (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  code         VARCHAR(50),
  phone        VARCHAR(30),
  email        VARCHAR(255),
  address      TEXT,
  city         VARCHAR(100),
  state        VARCHAR(100),
  pincode      VARCHAR(10),
  gstin        VARCHAR(20),
  pan          VARCHAR(15),
  bank_name    VARCHAR(100),
  bank_account VARCHAR(50),
  bank_ifsc    VARCHAR(20),
  notes        TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by   INTEGER      NOT NULL
);

CREATE INDEX idx_suppliers_tenant        ON suppliers (tenant_id);
CREATE INDEX idx_suppliers_tenant_active ON suppliers (tenant_id, is_active);
CREATE INDEX idx_suppliers_name_fts      ON suppliers USING GIN (to_tsvector('english', name));

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Apply updated_at triggers to Foundation Tables ───────────────────────────

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_company_modules_updated_at
  BEFORE UPDATE ON company_modules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_workflow_definitions_updated_at
  BEFORE UPDATE ON workflow_definitions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
