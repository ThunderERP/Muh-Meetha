-- ThunderERP Migration 004: Row Level Security
-- Enables RLS on every tenant-scoped table.
-- Policy pattern: every query is automatically filtered by tenant_id
-- extracted from the JWT claim set by the application layer.
--
-- HOW IT WORKS:
-- 1. NestJS sets a session variable: SET LOCAL app.current_tenant_id = <n>
-- 2. These policies read current_setting('app.current_tenant_id')
-- 3. DEVELOPER_ADMIN bypass is handled at application layer (not RLS)
--    so a compromised key cannot bypass tenant isolation at DB level.

-- ─── Helper: current tenant from session variable ─────────────────────────────

CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS INTEGER LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', TRUE)::INTEGER;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INTEGER LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN current_setting('app.current_user_id', TRUE)::INTEGER;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- ─── Enable RLS ───────────────────────────────────────────────────────────────

ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_modules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances   ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_acceptances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue            ENABLE ROW LEVEL SECURITY;
-- Inventory
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory            ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers            ENABLE ROW LEVEL SECURITY;
-- Future modules
ALTER TABLE customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking             ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases            ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints           ENABLE ROW LEVEL SECURITY;

-- ─── POLICY MACRO (applied per table) ────────────────────────────────────────
-- Pattern: SELECT/INSERT/UPDATE/DELETE all filtered by tenant_id = current_tenant_id()
-- The NestJS app connects as a single service role user (not per-tenant DB user)
-- so we use FORCE ROW LEVEL SECURITY to apply policies to superusers too.

-- ─── USERS ────────────────────────────────────────────────────────────────────

ALTER TABLE users FORCE ROW LEVEL SECURITY;

CREATE POLICY users_tenant_isolation ON users
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── USER SETTINGS ────────────────────────────────────────────────────────────

ALTER TABLE user_settings FORCE ROW LEVEL SECURITY;

CREATE POLICY user_settings_isolation ON user_settings
  USING (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_tenant_id()
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_tenant_id()
  ));

-- ─── USER PERMISSIONS ────────────────────────────────────────────────────────

ALTER TABLE user_permissions FORCE ROW LEVEL SECURITY;

CREATE POLICY user_permissions_isolation ON user_permissions
  USING (user_id IN (
    SELECT id FROM users WHERE tenant_id = current_tenant_id()
  ));

-- ─── COMPANY MODULES ─────────────────────────────────────────────────────────

ALTER TABLE company_modules FORCE ROW LEVEL SECURITY;

CREATE POLICY company_modules_isolation ON company_modules
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────

ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_isolation ON subscriptions
  USING (tenant_id = current_tenant_id());

-- ─── FEATURE FLAGS ───────────────────────────────────────────────────────────

ALTER TABLE feature_flags FORCE ROW LEVEL SECURITY;

CREATE POLICY feature_flags_isolation ON feature_flags
  USING (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- ─── COMPANY SETTINGS ────────────────────────────────────────────────────────

ALTER TABLE company_settings FORCE ROW LEVEL SECURITY;

CREATE POLICY company_settings_isolation ON company_settings
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

CREATE POLICY notifications_isolation ON notifications
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- Users can only see their own notifications
CREATE POLICY notifications_own_only ON notifications
  AS RESTRICTIVE
  USING (user_id = current_user_id());

-- ─── ACTIVITIES ──────────────────────────────────────────────────────────────

ALTER TABLE activities FORCE ROW LEVEL SECURITY;

CREATE POLICY activities_isolation ON activities
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- Audit logs are insert-only from app, read-only for admins
CREATE POLICY audit_logs_isolation ON audit_logs
  USING (tenant_id = current_tenant_id());

-- No updates or deletes on audit_logs (enforced via policy)
CREATE POLICY audit_logs_no_update ON audit_logs
  AS RESTRICTIVE
  FOR UPDATE USING (FALSE);

CREATE POLICY audit_logs_no_delete ON audit_logs
  AS RESTRICTIVE
  FOR DELETE USING (FALSE);

-- ─── DOMAIN EVENTS ───────────────────────────────────────────────────────────

ALTER TABLE domain_events FORCE ROW LEVEL SECURITY;

CREATE POLICY domain_events_isolation ON domain_events
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── WORKFLOW INSTANCES ───────────────────────────────────────────────────────

ALTER TABLE workflow_instances FORCE ROW LEVEL SECURITY;

CREATE POLICY workflow_instances_isolation ON workflow_instances
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── FILE RECORDS ────────────────────────────────────────────────────────────

ALTER TABLE file_records FORCE ROW LEVEL SECURITY;

CREATE POLICY file_records_isolation ON file_records
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── TERMS ACCEPTANCES ───────────────────────────────────────────────────────

ALTER TABLE terms_acceptances FORCE ROW LEVEL SECURITY;

CREATE POLICY terms_acceptances_isolation ON terms_acceptances
  USING (tenant_id = current_tenant_id());

-- ─── JOB QUEUE ───────────────────────────────────────────────────────────────

ALTER TABLE job_queue FORCE ROW LEVEL SECURITY;

CREATE POLICY job_queue_isolation ON job_queue
  USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
  WITH CHECK (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────

ALTER TABLE products FORCE ROW LEVEL SECURITY;

CREATE POLICY products_isolation ON products
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- Soft delete: by default only show non-deleted rows
CREATE POLICY products_no_deleted ON products
  AS RESTRICTIVE
  FOR SELECT USING (deleted_at IS NULL);

-- ─── INVENTORY ───────────────────────────────────────────────────────────────

ALTER TABLE inventory FORCE ROW LEVEL SECURITY;

CREATE POLICY inventory_via_product ON inventory
  USING (product_id IN (
    SELECT id FROM products WHERE tenant_id = current_tenant_id()
  ));

-- ─── STOCK MOVEMENTS ─────────────────────────────────────────────────────────

ALTER TABLE stock_movements FORCE ROW LEVEL SECURITY;

CREATE POLICY stock_movements_via_product ON stock_movements
  USING (product_id IN (
    SELECT id FROM products WHERE tenant_id = current_tenant_id()
  ));

-- Immutable: prevent deletes via RLS
CREATE POLICY stock_movements_no_delete ON stock_movements
  AS RESTRICTIVE
  FOR DELETE USING (FALSE);

-- ─── SUPPLIERS ───────────────────────────────────────────────────────────────

ALTER TABLE suppliers FORCE ROW LEVEL SECURITY;

CREATE POLICY suppliers_isolation ON suppliers
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── CUSTOMERS ───────────────────────────────────────────────────────────────

ALTER TABLE customers FORCE ROW LEVEL SECURITY;

CREATE POLICY customers_isolation ON customers
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── ORDERS ──────────────────────────────────────────────────────────────────

ALTER TABLE orders FORCE ROW LEVEL SECURITY;

CREATE POLICY orders_isolation ON orders
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────

ALTER TABLE order_items FORCE ROW LEVEL SECURITY;

CREATE POLICY order_items_via_order ON order_items
  USING (order_id IN (
    SELECT id FROM orders WHERE tenant_id = current_tenant_id()
  ));

-- ─── TRACKING ────────────────────────────────────────────────────────────────

ALTER TABLE tracking FORCE ROW LEVEL SECURITY;

CREATE POLICY tracking_via_order ON tracking
  USING (order_id IN (
    SELECT id FROM orders WHERE tenant_id = current_tenant_id()
  ));

-- ─── PURCHASES ───────────────────────────────────────────────────────────────

ALTER TABLE purchases FORCE ROW LEVEL SECURITY;

CREATE POLICY purchases_isolation ON purchases
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── PURCHASE ITEMS ──────────────────────────────────────────────────────────

ALTER TABLE purchase_items FORCE ROW LEVEL SECURITY;

CREATE POLICY purchase_items_via_purchase ON purchase_items
  USING (purchase_id IN (
    SELECT id FROM purchases WHERE tenant_id = current_tenant_id()
  ));

-- ─── INVOICES ────────────────────────────────────────────────────────────────

ALTER TABLE invoices FORCE ROW LEVEL SECURITY;

CREATE POLICY invoices_isolation ON invoices
  USING (tenant_id = current_tenant_id());

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────

ALTER TABLE payments FORCE ROW LEVEL SECURITY;

CREATE POLICY payments_via_invoice ON payments
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE tenant_id = current_tenant_id()
  ));

-- ─── TRANSACTIONS ────────────────────────────────────────────────────────────

ALTER TABLE transactions FORCE ROW LEVEL SECURITY;

CREATE POLICY transactions_via_payment ON transactions
  USING (payment_id IN (
    SELECT p.id FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    WHERE i.tenant_id = current_tenant_id()
  ));

-- ─── RETURN ITEMS ────────────────────────────────────────────────────────────

ALTER TABLE return_items FORCE ROW LEVEL SECURITY;

CREATE POLICY return_items_isolation ON return_items
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── LEADS ───────────────────────────────────────────────────────────────────

ALTER TABLE leads FORCE ROW LEVEL SECURITY;

CREATE POLICY leads_isolation ON leads
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── COMPLAINTS ──────────────────────────────────────────────────────────────

ALTER TABLE complaints FORCE ROW LEVEL SECURITY;

CREATE POLICY complaints_isolation ON complaints
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
