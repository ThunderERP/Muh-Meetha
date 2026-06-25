-- ThunderERP Migration 003: Sales, Purchase, Finance, CRM scaffold tables
-- These tables are schema-complete but have no API or UI yet.
-- They are created now so foreign keys are valid and future modules
-- can be added without data migrations.

-- ─── CUSTOMERS ────────────────────────────────────────────────────────────────

CREATE TABLE customers (
  id                       SERIAL PRIMARY KEY,
  tenant_id                INTEGER        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                     VARCHAR(255)   NOT NULL,
  phone                    VARCHAR(30)    NOT NULL,
  email                    VARCHAR(255),
  address                  TEXT,
  city                     VARCHAR(100),
  state                    VARCHAR(100),
  pincode                  VARCHAR(10),
  gstin                    VARCHAR(20),
  preferred_payment_method "PaymentMethod",
  credit_limit             NUMERIC(12, 2),
  is_active                BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_by               INTEGER        NOT NULL,
  CONSTRAINT uq_customer_tenant_phone UNIQUE (tenant_id, phone)
);

CREATE INDEX idx_customers_tenant        ON customers (tenant_id);
CREATE INDEX idx_customers_tenant_active ON customers (tenant_id, is_active);
CREATE INDEX idx_customers_name_fts      ON customers USING GIN (to_tsvector('english', name));

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── ORDERS ───────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id  INTEGER        NOT NULL REFERENCES customers(id),
  order_date   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  status       "OrderStatus"  NOT NULL DEFAULT 'PENDING',
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes        TEXT,
  is_active    BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_by   INTEGER        NOT NULL,
  updated_by   INTEGER
);

CREATE INDEX idx_orders_tenant          ON orders (tenant_id);
CREATE INDEX idx_orders_tenant_customer ON orders (tenant_id, customer_id);
CREATE INDEX idx_orders_tenant_status   ON orders (tenant_id, status);
CREATE INDEX idx_orders_order_date      ON orders (tenant_id, order_date DESC);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE order_items (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   INTEGER        NOT NULL REFERENCES products(id),
  quantity     INTEGER        NOT NULL CONSTRAINT order_item_qty_positive CHECK (quantity > 0),
  unit_price   NUMERIC(12, 2) NOT NULL,
  gst_pct      NUMERIC(5, 2)  NOT NULL,
  discount_pct NUMERIC(5, 2)  NOT NULL DEFAULT 0,
  line_total   NUMERIC(12, 2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items (order_id);

-- ─── TRACKING ─────────────────────────────────────────────────────────────────

CREATE TABLE tracking (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER          NOT NULL UNIQUE REFERENCES orders(id),
  status        "TrackingStatus" NOT NULL DEFAULT 'PENDING',
  tracking_date TIMESTAMPTZ,
  address       TEXT,
  updated_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_by    INTEGER
);

CREATE TRIGGER trg_tracking_updated_at
  BEFORE UPDATE ON tracking
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── PURCHASES ────────────────────────────────────────────────────────────────

CREATE TABLE purchases (
  id                     SERIAL PRIMARY KEY,
  tenant_id              INTEGER          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id            INTEGER          NOT NULL REFERENCES suppliers(id),
  purchase_date          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  expected_delivery_date TIMESTAMPTZ,
  status                 "PurchaseStatus" NOT NULL DEFAULT 'DRAFT',
  total_amount           NUMERIC(12, 2)   NOT NULL DEFAULT 0,
  notes                  TEXT,
  po_number              VARCHAR(50),
  approved_by            INTEGER,
  approved_at            TIMESTAMPTZ,
  is_active              BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  created_by             INTEGER          NOT NULL
);

CREATE INDEX idx_purchases_tenant          ON purchases (tenant_id);
CREATE INDEX idx_purchases_tenant_supplier ON purchases (tenant_id, supplier_id);
CREATE INDEX idx_purchases_tenant_status   ON purchases (tenant_id, status);

CREATE TRIGGER trg_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE purchase_items (
  id          SERIAL PRIMARY KEY,
  purchase_id INTEGER        NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id  INTEGER        NOT NULL REFERENCES products(id),
  quantity    INTEGER        NOT NULL CONSTRAINT purchase_item_qty_positive CHECK (quantity > 0),
  unit_price  NUMERIC(12, 2) NOT NULL,
  line_total  NUMERIC(12, 2) NOT NULL
);

CREATE INDEX idx_purchase_items_purchase ON purchase_items (purchase_id);

-- ─── INVOICES ─────────────────────────────────────────────────────────────────

CREATE TABLE invoices (
  id               SERIAL PRIMARY KEY,
  tenant_id        INTEGER         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id         INTEGER         NOT NULL UNIQUE REFERENCES orders(id),
  invoice_date     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  tax_amount       NUMERIC(12, 2)  NOT NULL DEFAULT 0,
  delivery_charges NUMERIC(12, 2)  NOT NULL DEFAULT 0,
  total_amount     NUMERIC(12, 2)  NOT NULL DEFAULT 0,
  paid_amount      NUMERIC(12, 2)  NOT NULL DEFAULT 0,
  status           "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
  due_date         TIMESTAMPTZ,
  is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_tenant ON invoices (tenant_id);
CREATE INDEX idx_invoices_status ON invoices (tenant_id, status);

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE payments (
  id             SERIAL PRIMARY KEY,
  invoice_id     INTEGER         NOT NULL REFERENCES invoices(id),
  amount         NUMERIC(12, 2)  NOT NULL,
  payment_method "PaymentMethod" NOT NULL,
  reference_id   VARCHAR(100),
  date           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  notes          TEXT,
  created_by     INTEGER         NOT NULL
);

CREATE INDEX idx_payments_invoice ON payments (invoice_id);

CREATE TABLE transactions (
  id           SERIAL PRIMARY KEY,
  payment_id   INTEGER           NOT NULL UNIQUE REFERENCES payments(id),
  type         "TransactionType" NOT NULL,
  amount       NUMERIC(12, 2)    NOT NULL,
  account_code VARCHAR(20)       NOT NULL,
  status       VARCHAR(20)       NOT NULL DEFAULT 'POSTED',
  entry_date   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  created_by   INTEGER           NOT NULL
);

-- ─── RETURNS ─────────────────────────────────────────────────────────────────

CREATE TABLE return_items (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id    INTEGER        NOT NULL REFERENCES orders(id),
  product_id  INTEGER        NOT NULL REFERENCES products(id),
  quantity    INTEGER        NOT NULL CONSTRAINT return_qty_positive CHECK (quantity > 0),
  type        "ReturnType"   NOT NULL,
  reason      TEXT           NOT NULL,
  status      "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
  refund_amt  NUMERIC(12, 2),
  resolved_at TIMESTAMPTZ,
  resolved_by INTEGER,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_by  INTEGER        NOT NULL
);

CREATE INDEX idx_return_items_tenant ON return_items (tenant_id);
CREATE INDEX idx_return_items_order  ON return_items (order_id);

CREATE TRIGGER trg_return_items_updated_at
  BEFORE UPDATE ON return_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── CRM ─────────────────────────────────────────────────────────────────────

CREATE TABLE leads (
  id                       SERIAL PRIMARY KEY,
  tenant_id                INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                     VARCHAR(255) NOT NULL,
  phone                    VARCHAR(30),
  email                    VARCHAR(255),
  source                   VARCHAR(100),
  status                   VARCHAR(50)  NOT NULL DEFAULT 'NEW',
  notes                    TEXT,
  assigned_to              INTEGER,
  converted_to_customer_id INTEGER      REFERENCES customers(id),
  is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by               INTEGER      NOT NULL
);

CREATE INDEX idx_leads_tenant        ON leads (tenant_id);
CREATE INDEX idx_leads_tenant_status ON leads (tenant_id, status);

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE complaints (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id INTEGER      NOT NULL REFERENCES customers(id),
  subject     VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL,
  status      VARCHAR(50)  NOT NULL DEFAULT 'OPEN',
  priority    VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
  resolved_at TIMESTAMPTZ,
  resolved_by INTEGER,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by  INTEGER      NOT NULL
);

CREATE INDEX idx_complaints_tenant   ON complaints (tenant_id);
CREATE INDEX idx_complaints_customer ON complaints (tenant_id, customer_id);

CREATE TRIGGER trg_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
