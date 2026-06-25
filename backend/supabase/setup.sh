#!/bin/bash
# ThunderERP — Supabase Setup Script
# Run this once against a fresh Supabase project.
# Prerequisites: supabase CLI installed and linked to your project.
#
# Usage:
#   chmod +x supabase/setup.sh
#   ./supabase/setup.sh

set -e

echo "═══════════════════════════════════════════════════════"
echo " ThunderERP — Supabase Database Setup"
echo "═══════════════════════════════════════════════════════"

# ─── Check env ────────────────────────────────────────────────────────────────
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Export it before running this script."
  exit 1
fi

PSQL="psql $DATABASE_URL"

echo ""
echo "▶ Step 1: Running migration 001 — Core Foundation..."
$PSQL -f supabase/migrations/001_core_foundation.sql
echo "  ✓ Core tables created"

echo ""
echo "▶ Step 2: Running migration 002 — Inventory Module..."
$PSQL -f supabase/migrations/002_inventory_module.sql
echo "  ✓ Inventory tables created"

echo ""
echo "▶ Step 3: Running migration 003 — Future Module Scaffolds..."
$PSQL -f supabase/migrations/003_future_modules_scaffold.sql
echo "  ✓ Sales / Purchase / Finance / CRM schemas created"

echo ""
echo "▶ Step 4: Running migration 004 — Row Level Security..."
$PSQL -f supabase/migrations/004_rls_policies.sql
echo "  ✓ RLS policies applied to all tables"

echo ""
echo "▶ Step 5: Running migration 005 — RBAC seed..."
$PSQL -f supabase/migrations/005_rbac_seed.sql
echo "  ✓ Permissions and role assignments seeded"

if [ "$NODE_ENV" = "development" ] || [ "$SEED_DEMO" = "true" ]; then
  echo ""
  echo "▶ Step 6: Running migration 006 — Demo seed data..."
  $PSQL -f supabase/migrations/006_demo_seed.sql
  echo "  ✓ Demo company, users, and products seeded"
  echo "     Login: company=demo-corp | email=admin@democorp.in | password=Admin@1234"
else
  echo ""
  echo "  ℹ Skipping demo seed (set SEED_DEMO=true to include it)"
fi

# ─── Create Supabase Storage Bucket ───────────────────────────────────────────
echo ""
echo "▶ Step 7: Creating Supabase Storage bucket..."

if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  curl -s -X POST "${SUPABASE_URL}/storage/v1/bucket" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"id":"thundererp-files","name":"thundererp-files","public":true}' \
    | grep -q '"id"' \
    && echo "  ✓ Storage bucket 'thundererp-files' created" \
    || echo "  ⚠ Bucket may already exist or SUPABASE credentials not set"
else
  echo "  ⚠ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping bucket creation"
  echo "    Create bucket 'thundererp-files' manually in Supabase dashboard"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo " ✓ ThunderERP database setup complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo " Next steps:"
echo "   1. cp .env.example .env && fill in your values"
echo "   2. npm install"
echo "   3. npx prisma generate"
echo "   4. npm run start:dev"
echo "   5. Open http://localhost:3001/api/docs (Swagger)"
echo ""
