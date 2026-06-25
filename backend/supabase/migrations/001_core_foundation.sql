-- ThunderERP Migration 001: Core Foundation
-- Creates: enums, tenants, users, user_settings, permissions, RBAC tables,
--          module registry, subscriptions, feature_flags, company_settings,
--          notifications, activities, audit_logs, domain_events, workflow tables,
--          job_queue, file_records, terms_acceptances

-- ─── Enable Extensions ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for fast text search

-- ─── ENUMS ────────────────────────────────────────────────────────────────────

CREATE TYPE "Role" AS ENUM (
  'DEVELOPER_ADMIN', 'BUSINESS_OWNER', 'SALES_MANAGER', 'SALES_STAFF',
  'INVENTORY_MANAGER', 'FINANCE_MANAGER', 'ACCOUNTANT', 'CRM_SUPPORT',
  'REFUND_HANDLER', 'MANAGER'
);

CREATE TYPE "TenantPlan" AS ENUM ('STARTER', 'GROWTH', 'ENTERPRISE');

CREATE TYPE "ModuleKey" AS ENUM (
  'INVENTORY', 'SALES', 'PURCHASE', 'ACCOUNTING', 'CRM', 'HRMS',
  'PAYROLL', 'MANUFACTURING', 'POS', 'ASSET_MANAGEMENT',
  'SERVICE_MANAGEMENT', 'PROJECT_MANAGEMENT', 'ANALYTICS',
  'COMPLIANCE', 'WORKFLOW_AUTOMATION'
);

CREATE TYPE "ModuleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRIAL');

CREATE TYPE "PermissionAction" AS ENUM (
  'VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE', 'APPROVE'
);

CREATE TYPE "WorkflowStatus" AS ENUM (
  'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'
);

CREATE TYPE "NotificationChannel" AS ENUM (
  'IN_APP', 'EMAIL', 'SMS', 'PUSH', 'WHATSAPP'
);

CREATE TYPE "NotificationStatus" AS ENUM (
  'PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ'
);

CREATE TYPE "JobStatus" AS ENUM (
  'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
);

CREATE TYPE "AuditAction" AS ENUM (
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
  'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'ACTIVATE', 'DEACTIVATE'
);

CREATE TYPE "FileEntityType" AS ENUM (
  'PRODUCT', 'CUSTOMER', 'SUPPLIER', 'ORDER', 'PURCHASE',
  'RETURN', 'COMPLAINT', 'INVOICE', 'USER', 'COMPANY'
);

CREATE TYPE "StockMovementType" AS ENUM (
  'INWARD', 'OUTWARD', 'ADJUSTMENT', 'RESERVATION', 'RESERVATION_RELEASE'
);

CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED',
  'COMPLETED', 'CANCELLED', 'RETURNED'
);

CREATE TYPE "PurchaseStatus" AS ENUM (
  'DRAFT', 'PENDING', 'APPROVED', 'RECEIVED', 'COMPLETED', 'CANCELLED'
);

CREATE TYPE "InvoiceStatus" AS ENUM (
  'PENDING', 'PARTIAL', 'PAID', 'FAILED', 'CANCELLED'
);

CREATE TYPE "ReturnStatus" AS ENUM (
  'REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'
);

CREATE TYPE "ReturnType" AS ENUM ('REFUND', 'RETURN', 'REPLACEMENT');

CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK', 'CARD', 'CREDIT');

CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT');

CREATE TYPE "TrackingStatus" AS ENUM (
  'PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'
);

-- ─── TENANTS ──────────────────────────────────────────────────────────────────

CREATE TABLE tenants (
  id                SERIAL PRIMARY KEY,
  slug              VARCHAR(60)  NOT NULL UNIQUE,
  name              VARCHAR(255) NOT NULL,
  legal_name        VARCHAR(255),
  plan              "TenantPlan" NOT NULL DEFAULT 'STARTER',
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  max_users         INTEGER      NOT NULL DEFAULT 10,
  storage_quota_mb  INTEGER      NOT NULL DEFAULT 500,
  phone             VARCHAR(30),
  website           VARCHAR(255),
  email             VARCHAR(255),
  gstin             VARCHAR(20),
  pan               VARCHAR(15),
  cin               VARCHAR(25),
  industry          VARCHAR(100),
  business_type     VARCHAR(100),
  country           VARCHAR(100) NOT NULL DEFAULT 'India',
  state             VARCHAR(100),
  city              VARCHAR(100),
  pincode           VARCHAR(10),
  address           TEXT,
  timezone          VARCHAR(60)  NOT NULL DEFAULT 'Asia/Kolkata',
  currency          VARCHAR(10)  NOT NULL DEFAULT 'INR',
  fiscal_year_start INTEGER      NOT NULL DEFAULT 4
    CONSTRAINT fys_valid CHECK (fiscal_year_start BETWEEN 1 AND 12),
  tos_accepted_at   TIMESTAMPTZ,
  tos_accepted_ip   VARCHAR(50),
  is_email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
  trial_ends_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants (slug);
CREATE INDEX idx_tenants_is_active ON tenants (is_active);

-- ─── USERS ────────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          "Role"       NOT NULL DEFAULT 'SALES_STAFF',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  phone         VARCHAR(30),
  job_title     VARCHAR(100),
  avatar_url    VARCHAR(500),
  last_login_at TIMESTAMPTZ,
  last_login_ip VARCHAR(50),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by    INTEGER,
  CONSTRAINT uq_user_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_id    ON users (tenant_id);
CREATE INDEX idx_users_tenant_role  ON users (tenant_id, role);
CREATE INDEX idx_users_tenant_email ON users (tenant_id, email);
CREATE INDEX idx_users_is_active    ON users (tenant_id, is_active);

-- ─── USER SETTINGS ────────────────────────────────────────────────────────────

CREATE TABLE user_settings (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme                 VARCHAR(20)  NOT NULL DEFAULT 'light',
  language              VARCHAR(10)  NOT NULL DEFAULT 'en',
  date_format           VARCHAR(20)  NOT NULL DEFAULT 'DD/MM/YYYY',
  currency              VARCHAR(10)  NOT NULL DEFAULT 'INR',
  timezone              VARCHAR(60)  NOT NULL DEFAULT 'Asia/Kolkata',
  notify_order_updates  BOOLEAN      NOT NULL DEFAULT TRUE,
  notify_low_stock      BOOLEAN      NOT NULL DEFAULT TRUE,
  notify_payments       BOOLEAN      NOT NULL DEFAULT TRUE,
  notify_returns        BOOLEAN      NOT NULL DEFAULT TRUE,
  sidebar_collapsed     BOOLEAN      NOT NULL DEFAULT FALSE,
  inv_show_sku          BOOLEAN      NOT NULL DEFAULT TRUE,
  inv_show_gst          BOOLEAN      NOT NULL DEFAULT TRUE,
  inv_show_discount     BOOLEAN      NOT NULL DEFAULT TRUE,
  inv_show_reorder_level BOOLEAN     NOT NULL DEFAULT TRUE,
  inv_show_image        BOOLEAN      NOT NULL DEFAULT TRUE,
  inv_show_mfg_date     BOOLEAN      NOT NULL DEFAULT FALSE,
  inv_show_expiry_date  BOOLEAN      NOT NULL DEFAULT TRUE,
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── PERMISSIONS (static seed table) ─────────────────────────────────────────

CREATE TABLE permissions (
  id          SERIAL PRIMARY KEY,
  module      "ModuleKey"        NOT NULL,
  resource    VARCHAR(100)       NOT NULL,
  action      "PermissionAction" NOT NULL,
  description VARCHAR(255),
  CONSTRAINT uq_perm_module_resource_action UNIQUE (module, resource, action)
);

CREATE TABLE role_permissions (
  id            SERIAL PRIMARY KEY,
  role          "Role"   NOT NULL,
  permission_id INTEGER  NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  CONSTRAINT uq_role_permission UNIQUE (role, permission_id)
);

CREATE TABLE user_permissions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER  NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted       BOOLEAN  NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_permission UNIQUE (user_id, permission_id)
);

-- ─── MODULE REGISTRY ──────────────────────────────────────────────────────────

CREATE TABLE company_modules (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER       NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_key   "ModuleKey"   NOT NULL,
  status       "ModuleStatus" NOT NULL DEFAULT 'INACTIVE',
  activated_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  config       JSONB,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_company_module UNIQUE (tenant_id, module_key)
);

CREATE INDEX idx_company_modules_tenant ON company_modules (tenant_id);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────

CREATE TABLE subscriptions (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan        "TenantPlan" NOT NULL,
  starts_at   TIMESTAMPTZ  NOT NULL,
  ends_at     TIMESTAMPTZ,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  max_users   INTEGER      NOT NULL DEFAULT 10,
  storage_mb  INTEGER      NOT NULL DEFAULT 500,
  metadata    JSONB,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions (tenant_id);

-- ─── FEATURE FLAGS ────────────────────────────────────────────────────────────

CREATE TABLE feature_flags (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER      REFERENCES tenants(id) ON DELETE CASCADE,
  key         VARCHAR(100) NOT NULL,
  enabled     BOOLEAN      NOT NULL DEFAULT FALSE,
  description VARCHAR(255),
  metadata    JSONB,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_feature_flag UNIQUE (tenant_id, key)
);

-- ─── COMPANY SETTINGS ─────────────────────────────────────────────────────────

CREATE TABLE company_settings (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module     VARCHAR(60)  NOT NULL,
  key        VARCHAR(100) NOT NULL,
  value      JSONB        NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_company_setting UNIQUE (tenant_id, module, key)
);

CREATE INDEX idx_company_settings_tenant_module ON company_settings (tenant_id, module);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER                 NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    INTEGER                 NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel    "NotificationChannel"   NOT NULL DEFAULT 'IN_APP',
  status     "NotificationStatus"    NOT NULL DEFAULT 'PENDING',
  title      VARCHAR(255)            NOT NULL,
  body       TEXT                    NOT NULL,
  data       JSONB,
  read_at    TIMESTAMPTZ,
  sent_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_status ON notifications (tenant_id, user_id, status);
CREATE INDEX idx_notifications_unread      ON notifications (tenant_id, user_id, read_at) WHERE read_at IS NULL;

-- ─── ACTIVITY FEED ────────────────────────────────────────────────────────────

CREATE TABLE activities (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module       "ModuleKey",
  action       VARCHAR(500) NOT NULL,
  entity_type  VARCHAR(100),
  entity_id    INTEGER,
  metadata     JSONB,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_tenant_time   ON activities (tenant_id, created_at DESC);
CREATE INDEX idx_activities_tenant_user   ON activities (tenant_id, user_id);
CREATE INDEX idx_activities_entity        ON activities (tenant_id, entity_type, entity_id);

-- ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER       NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action       "AuditAction" NOT NULL,
  module       VARCHAR(60)   NOT NULL,
  entity_type  VARCHAR(100)  NOT NULL,
  entity_id    INTEGER,
  before       JSONB,
  after        JSONB,
  ip_address   VARCHAR(50),
  user_agent   TEXT,
  request_id   VARCHAR(36),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Audit logs are insert-only — no update or delete allowed
CREATE INDEX idx_audit_logs_tenant_time    ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_tenant_user    ON audit_logs (tenant_id, user_id);
CREATE INDEX idx_audit_logs_module_entity  ON audit_logs (tenant_id, module, entity_type);
CREATE INDEX idx_audit_logs_entity_ref     ON audit_logs (tenant_id, entity_type, entity_id);

-- ─── DOMAIN EVENTS ────────────────────────────────────────────────────────────

CREATE TABLE domain_events (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type      VARCHAR(100) NOT NULL,
  aggregate_id    INTEGER,
  aggregate_type  VARCHAR(100),
  payload         JSONB        NOT NULL,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_domain_events_tenant_type        ON domain_events (tenant_id, event_type);
CREATE INDEX idx_domain_events_unprocessed        ON domain_events (tenant_id, processed_at) WHERE processed_at IS NULL;

-- ─── WORKFLOW ENGINE ──────────────────────────────────────────────────────────

CREATE TABLE workflow_definitions (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  module       VARCHAR(60)  NOT NULL,
  entity_type  VARCHAR(100) NOT NULL,
  trigger_on   VARCHAR(60)  NOT NULL,
  steps        JSONB        NOT NULL,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_instances (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER           NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  definition_id  INTEGER           NOT NULL REFERENCES workflow_definitions(id),
  entity_type    VARCHAR(100)      NOT NULL,
  entity_id      INTEGER           NOT NULL,
  status         "WorkflowStatus"  NOT NULL DEFAULT 'DRAFT',
  current_step   INTEGER           NOT NULL DEFAULT 0,
  data           JSONB,
  started_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  created_by     INTEGER           NOT NULL
);

CREATE INDEX idx_workflow_instances_tenant_status ON workflow_instances (tenant_id, status);
CREATE INDEX idx_workflow_instances_entity        ON workflow_instances (tenant_id, entity_type, entity_id);

CREATE TABLE workflow_actions (
  id          SERIAL PRIMARY KEY,
  instance_id INTEGER      NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  user_id     INTEGER      NOT NULL REFERENCES users(id),
  step        INTEGER      NOT NULL,
  action      VARCHAR(60)  NOT NULL,
  comments    TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_actions_instance ON workflow_actions (instance_id);

-- ─── JOB QUEUE ────────────────────────────────────────────────────────────────

CREATE TABLE job_queue (
  id           SERIAL PRIMARY KEY,
  tenant_id    INTEGER      REFERENCES tenants(id) ON DELETE SET NULL,
  job_type     VARCHAR(100) NOT NULL,
  status       "JobStatus"  NOT NULL DEFAULT 'PENDING',
  payload      JSONB        NOT NULL,
  result       JSONB,
  attempts     INTEGER      NOT NULL DEFAULT 0,
  max_attempts INTEGER      NOT NULL DEFAULT 3,
  error        TEXT,
  scheduled_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_queue_status_scheduled ON job_queue (status, scheduled_at) WHERE status IN ('PENDING', 'RUNNING');
CREATE INDEX idx_job_queue_tenant_type      ON job_queue (tenant_id, job_type);

-- ─── FILE RECORDS ─────────────────────────────────────────────────────────────

CREATE TABLE file_records (
  id            SERIAL PRIMARY KEY,
  tenant_id     INTEGER         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type   "FileEntityType" NOT NULL,
  entity_id     INTEGER         NOT NULL,
  field_name    VARCHAR(100)    NOT NULL,
  original_name VARCHAR(255)    NOT NULL,
  mime_type     VARCHAR(100)    NOT NULL,
  size_bytes    INTEGER         NOT NULL,
  storage_key   VARCHAR(500)    NOT NULL,
  url           VARCHAR(1000)   NOT NULL,
  driver        VARCHAR(20)     NOT NULL DEFAULT 'local',
  is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
  uploaded_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  uploaded_by   INTEGER         NOT NULL
);

CREATE INDEX idx_file_records_entity    ON file_records (tenant_id, entity_type, entity_id);
CREATE INDEX idx_file_records_tenant    ON file_records (tenant_id);

-- ─── TERMS ACCEPTANCE ─────────────────────────────────────────────────────────

CREATE TABLE terms_acceptances (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id    INTEGER      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version      VARCHAR(50)  NOT NULL,
  accepted_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ip_address   VARCHAR(50),
  user_agent   TEXT
);

CREATE INDEX idx_terms_user   ON terms_acceptances (user_id);
CREATE INDEX idx_terms_tenant ON terms_acceptances (tenant_id);
