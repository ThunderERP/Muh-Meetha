# ThunderERP — Deployment Guide

## Architecture

```
Frontend   → Vercel          (Next.js 14 App Router)
Backend    → Railway         (NestJS)
Database   → Supabase        (PostgreSQL 15 + RLS)
Storage    → Supabase Storage OR AWS S3
```

---

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL client (`psql`)
- Supabase account (free tier works for dev)
- Railway account
- Vercel account

---

## Step 1 — Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Set a strong database password and save it
3. Note your project URL and anon key from Project Settings → API

### 1.2 Run Migrations

```bash
# From backend/ directory
export DATABASE_URL="postgresql://postgres:<password>@<host>:5432/postgres"

# Option A: Shell script (recommended)
chmod +x supabase/setup.sh
./supabase/setup.sh

# Option B: Run migrations manually in order
psql $DATABASE_URL -f supabase/migrations/001_core_foundation.sql
psql $DATABASE_URL -f supabase/migrations/002_inventory_module.sql
psql $DATABASE_URL -f supabase/migrations/003_future_modules_scaffold.sql
psql $DATABASE_URL -f supabase/migrations/004_rls_policies.sql
psql $DATABASE_URL -f supabase/migrations/005_rbac_seed.sql

# Development only (includes demo data)
SEED_DEMO=true ./supabase/setup.sh
```

### 1.3 Supabase Storage

In the Supabase dashboard:
1. Storage → New Bucket
2. Name: `thundererp-files`
3. Public: ✓ (for product images)
4. File size limit: 5 MB

### 1.4 Get Connection String

Settings → Database → Connection string → URI (use this as `DATABASE_URL`)

---

## Step 2 — Backend Deployment (Railway)

### 2.1 Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
```

### 2.2 Set Environment Variables

In Railway dashboard → Variables, set ALL of these:

```env
DATABASE_URL=postgresql://postgres:<pass>@<host>:5432/postgres
JWT_SECRET=<generate: openssl rand -base64 64>
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-app.vercel.app
APP_URL=https://your-backend.railway.app

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
SUPABASE_ANON_KEY=<from Supabase dashboard>

# Storage — choose one:
STORAGE_DRIVER=local
# OR for production:
# STORAGE_DRIVER=s3
# AWS_REGION=ap-south-1
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_S3_BUCKET=thundererp-uploads

BCRYPT_ROUNDS=12
THROTTLE_TTL=60
THROTTLE_LIMIT=100
AUTH_THROTTLE_LIMIT=10
```

### 2.3 Deploy

```bash
cd backend/
railway up
```

### 2.4 Verify

```
GET https://your-backend.railway.app/api/v1/auth/me
→ 401 Unauthorized  (correct — no token yet)

GET https://your-backend.railway.app/api/docs
→ Swagger UI (disable in production by removing the block in main.ts)
```

---

## Step 3 — Frontend Deployment (Vercel)

### 3.1 Set Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=ThunderERP
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

### 3.2 Deploy

```bash
cd frontend/
npm install
npm run build   # verify build passes locally first
vercel --prod
```

---

## Step 4 — Generate Prisma Client

The backend must generate the Prisma client before starting:

```bash
cd backend/
npx prisma generate
npm run build
```

Add to `package.json` scripts:
```json
"start": "npx prisma generate && node dist/main"
```

---

## Step 5 — First Login

After deployment, register your company:

```
POST /api/v1/auth/register-tenant
{
  "companyName": "My Company",
  "slug": "my-company",
  "adminName": "Your Name",
  "adminEmail": "you@company.com",
  "password": "SecurePass@123",
  "tosAccepted": true,
  "privacyAccepted": true
}
```

Or use the Register Company page at `/register`.

---

## Step 6 — Production Hardening Checklist

- [ ] Change `JWT_SECRET` to a 64+ character random string
- [ ] Set `BCRYPT_ROUNDS=14` for production (slower = more secure)
- [ ] Enable Supabase RLS in dashboard (should already be active from migration 004)
- [ ] Disable Swagger: remove the `if (NODE_ENV !== 'production')` block or keep it behind auth
- [ ] Configure Railway custom domain with HTTPS
- [ ] Set `FRONTEND_URL` in backend to exact Vercel URL (no trailing slash)
- [ ] Enable Supabase PITR (Point-in-Time Recovery) for production data
- [ ] Set up Railway health checks on `/api/v1/health`
- [ ] Add rate limit monitoring via Railway metrics
- [ ] Rotate service role key: never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend

---

## Local Development

```bash
# 1. Database
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15

# 2. Backend
cd backend/
cp .env.example .env
# Edit .env with DATABASE_URL=postgresql://postgres:postgres@localhost:5432/thundererp
npm install
npx prisma generate
npx prisma migrate dev   # runs Prisma-aware migrations
# OR use raw SQL:
# psql $DATABASE_URL -f supabase/migrations/001_core_foundation.sql ...
npm run db:seed          # seed demo data
npm run start:dev        # http://localhost:3001

# 3. Frontend
cd frontend/
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
npm install
npm run dev              # http://localhost:3000
```

---

## API Routes Summary

| Method | Route                              | Description                   | Auth  |
|--------|------------------------------------|-------------------------------|-------|
| POST   | /auth/login-tenant                 | Login with slug+email+pass    | Public|
| POST   | /auth/register-tenant              | Register company + admin      | Public|
| GET    | /auth/me                           | Get current user + tenant     | JWT   |
| POST   | /auth/change-password              | Change password               | JWT   |
| GET    | /users                             | List users                    | JWT   |
| POST   | /users                             | Create user                   | Admin |
| PUT    | /users/me                          | Update own profile            | JWT   |
| PATCH  | /users/:id/deactivate              | Deactivate user               | Admin |
| GET    | /company                           | Get company details           | JWT   |
| PUT    | /company                           | Update company details        | Admin |
| GET    | /company/modules                   | Get active modules            | JWT   |
| GET    | /products                          | List products                 | JWT   |
| POST   | /products                          | Create product                | Inv+  |
| PUT    | /products/:id                      | Update product                | Inv+  |
| DELETE | /products/:id                      | Soft delete product           | Admin |
| GET    | /products/categories               | Get distinct categories       | JWT   |
| GET    | /products/export/csv               | Export CSV                    | JWT   |
| GET    | /inventory/dashboard               | Dashboard KPIs                | JWT   |
| POST   | /inventory/:id/adjust              | Adjust stock                  | Inv+  |
| GET    | /inventory/:id/history             | Stock history                 | JWT   |
| GET    | /reorder-alerts                    | Low stock alerts              | JWT   |
| GET    | /stock-movements                   | Full movement log             | JWT   |
| GET    | /suppliers                         | List suppliers                | JWT   |
| POST   | /suppliers                         | Create supplier               | Inv+  |
| PUT    | /suppliers/:id                     | Update supplier               | Inv+  |
| DELETE | /suppliers/:id                     | Remove supplier               | Inv+  |
| GET    | /audit-logs                        | Audit log (admin only)        | Admin |
| POST   | /uploads                           | Upload file                   | JWT   |
| GET    | /notifications                     | User notifications            | JWT   |
| PATCH  | /notifications/mark-all-read       | Mark all read                 | JWT   |
| GET    | /settings/company                  | Company settings              | JWT   |
| POST   | /settings/company                  | Update company setting        | Admin |
| GET    | /settings/user                     | User preferences              | JWT   |
| PUT    | /settings/user                     | Update user preferences       | JWT   |
| GET    | /settings/features                 | Feature flags                 | JWT   |

---

## Multi-Tenancy Architecture

Every request is isolated at three layers:

1. **JWT**: contains `tenantId` — no cross-tenant token reuse possible
2. **Service Layer**: every query includes `where: { tenantId }` from the JWT
3. **Database RLS**: PostgreSQL session variable `app.current_tenant_id` set per transaction,
   policies enforce isolation even if the service layer has a bug

This triple isolation means:
- A bug in NestJS cannot leak tenant data past the DB
- A compromised JWT from Tenant A cannot access Tenant B data
- Direct DB connections (e.g. Supabase Studio) respect RLS via session variable

---

## Troubleshooting

**RLS blocking queries during dev:**
```sql
-- Temporarily set context for manual psql queries
SET app.current_tenant_id = 1;
SET app.current_user_id = 1;
SELECT * FROM products;
```

**Prisma and RLS:**
The `PrismaService.withTenantContext()` wraps every mutation in a transaction
that sets `SET LOCAL app.current_tenant_id`. If you bypass this (raw `prisma.x.create`
without context), RLS will reject the query unless session vars are set.

**bcrypt on Railway:**
Railway uses Node 20 — bcrypt native bindings build fine. If you see errors:
```bash
npm rebuild bcrypt --update-binary
```
