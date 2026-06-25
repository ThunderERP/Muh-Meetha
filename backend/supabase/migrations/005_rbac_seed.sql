-- ThunderERP Migration 005: RBAC Permission Seeds
-- Seeds all permissions for the Inventory module.
-- Role assignments reflect the principle of least privilege.
-- Future modules: add permissions in their own migration.

-- ─── INVENTORY PERMISSIONS ───────────────────────────────────────────────────

INSERT INTO permissions (module, resource, action, description) VALUES
  -- Products
  ('INVENTORY', 'products', 'VIEW',   'View product list and details'),
  ('INVENTORY', 'products', 'CREATE', 'Create new products'),
  ('INVENTORY', 'products', 'EDIT',   'Edit existing products'),
  ('INVENTORY', 'products', 'DELETE', 'Delete / archive products'),
  ('INVENTORY', 'products', 'EXPORT', 'Export product data'),
  ('INVENTORY', 'products', 'MANAGE', 'Full product management'),
  -- Stock
  ('INVENTORY', 'stock', 'VIEW',   'View stock levels'),
  ('INVENTORY', 'stock', 'CREATE', 'Add stock (inward)'),
  ('INVENTORY', 'stock', 'EDIT',   'Adjust stock quantities'),
  ('INVENTORY', 'stock', 'MANAGE', 'Full stock management'),
  -- Suppliers
  ('INVENTORY', 'suppliers', 'VIEW',   'View supplier list'),
  ('INVENTORY', 'suppliers', 'CREATE', 'Add new suppliers'),
  ('INVENTORY', 'suppliers', 'EDIT',   'Edit supplier details'),
  ('INVENTORY', 'suppliers', 'DELETE', 'Remove suppliers'),
  ('INVENTORY', 'suppliers', 'MANAGE', 'Full supplier management'),
  -- Reports
  ('INVENTORY', 'reports', 'VIEW',   'View inventory reports'),
  ('INVENTORY', 'reports', 'EXPORT', 'Export inventory reports'),
  -- Audit Logs
  ('INVENTORY', 'audit_logs', 'VIEW', 'View inventory audit logs'),
  -- Settings
  ('INVENTORY', 'settings', 'VIEW',   'View inventory settings'),
  ('INVENTORY', 'settings', 'EDIT',   'Edit inventory settings'),
  ('INVENTORY', 'settings', 'MANAGE', 'Manage all inventory settings')
ON CONFLICT (module, resource, action) DO NOTHING;

-- ─── ROLE → PERMISSION ASSIGNMENTS ───────────────────────────────────────────

-- Helper: assign all matching permissions to a role
-- DEVELOPER_ADMIN: everything
INSERT INTO role_permissions (role, permission_id)
  SELECT 'DEVELOPER_ADMIN', id FROM permissions
  ON CONFLICT DO NOTHING;

-- BUSINESS_OWNER: everything
INSERT INTO role_permissions (role, permission_id)
  SELECT 'BUSINESS_OWNER', id FROM permissions
  ON CONFLICT DO NOTHING;

-- MANAGER: everything inventory
INSERT INTO role_permissions (role, permission_id)
  SELECT 'MANAGER', id FROM permissions WHERE module = 'INVENTORY'
  ON CONFLICT DO NOTHING;

-- INVENTORY_MANAGER: all inventory except delete and manage settings
INSERT INTO role_permissions (role, permission_id)
  SELECT 'INVENTORY_MANAGER', id FROM permissions
  WHERE module = 'INVENTORY'
    AND NOT (resource = 'settings' AND action = 'MANAGE')
    AND NOT (resource = 'products' AND action = 'DELETE')
  ON CONFLICT DO NOTHING;

-- SALES_MANAGER: view-only inventory
INSERT INTO role_permissions (role, permission_id)
  SELECT 'SALES_MANAGER', id FROM permissions
  WHERE module = 'INVENTORY' AND action = 'VIEW'
  ON CONFLICT DO NOTHING;

-- SALES_STAFF: view products and stock only
INSERT INTO role_permissions (role, permission_id)
  SELECT 'SALES_STAFF', id FROM permissions
  WHERE module = 'INVENTORY' AND resource IN ('products', 'stock') AND action = 'VIEW'
  ON CONFLICT DO NOTHING;

-- FINANCE_MANAGER: view inventory + reports + export
INSERT INTO role_permissions (role, permission_id)
  SELECT 'FINANCE_MANAGER', id FROM permissions
  WHERE module = 'INVENTORY' AND action IN ('VIEW', 'EXPORT')
  ON CONFLICT DO NOTHING;

-- ACCOUNTANT: view inventory + reports
INSERT INTO role_permissions (role, permission_id)
  SELECT 'ACCOUNTANT', id FROM permissions
  WHERE module = 'INVENTORY' AND action = 'VIEW'
  ON CONFLICT DO NOTHING;

-- CRM_SUPPORT: view products only
INSERT INTO role_permissions (role, permission_id)
  SELECT 'CRM_SUPPORT', id FROM permissions
  WHERE module = 'INVENTORY' AND resource = 'products' AND action = 'VIEW'
  ON CONFLICT DO NOTHING;

-- REFUND_HANDLER: view stock only
INSERT INTO role_permissions (role, permission_id)
  SELECT 'REFUND_HANDLER', id FROM permissions
  WHERE module = 'INVENTORY' AND resource = 'stock' AND action = 'VIEW'
  ON CONFLICT DO NOTHING;

-- ─── GLOBAL FEATURE FLAGS (defaults) ─────────────────────────────────────────

INSERT INTO feature_flags (tenant_id, key, enabled, description) VALUES
  (NULL, 'INVENTORY_MODULE',        TRUE,  'Core inventory module'),
  (NULL, 'SALES_MODULE',            FALSE, 'Sales module (coming soon)'),
  (NULL, 'PURCHASE_MODULE',         FALSE, 'Purchase module (coming soon)'),
  (NULL, 'ACCOUNTING_MODULE',       FALSE, 'Accounting module (coming soon)'),
  (NULL, 'CRM_MODULE',              FALSE, 'CRM module (coming soon)'),
  (NULL, 'HRMS_MODULE',             FALSE, 'HRMS module (coming soon)'),
  (NULL, 'BARCODE_SCANNING',        FALSE, 'Barcode scanning feature'),
  (NULL, 'BULK_IMPORT',             FALSE, 'Bulk CSV/Excel import'),
  (NULL, 'EMAIL_NOTIFICATIONS',     FALSE, 'Email notification delivery'),
  (NULL, 'WORKFLOW_ENGINE',         FALSE, 'Approval workflow engine'),
  (NULL, 'ADVANCED_REPORTING',      FALSE, 'Advanced BI reports'),
  (NULL, 'MULTI_WAREHOUSE',         FALSE, 'Multi-warehouse management')
ON CONFLICT (tenant_id, key) DO NOTHING;
