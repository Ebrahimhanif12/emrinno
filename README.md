# Emrinno

Emrinno is a Frolinno product that provides pay-per-use AI services with clear BDT pricing.

The first service is **Subminno**, an academic writing workflow for AI-writing detection, review, improvement, and recheck. **Presentation Maker** is reserved as the second service and currently has a placeholder route only.

## Current route structure

```text
/                              Emrinno platform home
/subminno                      Subminno landing/upload
/subminno/check/[documentId]   Subminno document workspace
/presentation                  Presentation Maker placeholder
/check/[documentId]            Legacy redirect to the Subminno workspace
```

## Architecture

Shared platform code lives under areas such as:

```text
components/platform/
lib/auth/
lib/payments/
lib/platform/
lib/supabase/
```

Subminno-specific code is isolated under:

```text
components/subminno/
lib/services/subminno/
app/actions/subminno/
app/api/subminno/
app/subminno/
```

The in-memory guest document provider is intentionally scoped to the `/subminno` layout so guest document text is not kept while navigating around unrelated Emrinno services.

## Local setup

Install dependencies:

```bash
npm ci
```

Create `.env.local` locally. Do not commit it.

Required public Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Backend-only configuration used by privileged server infrastructure:

```env
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
```

Never prefix the secret key with `NEXT_PUBLIC_`.

Run:

```bash
npm run dev
npm run build
```

## Important

The current billing/provider foundation is intentionally not gateway-specific. SSLCOMMERZ or another provider will be added only after the merchant decision is finalized.

See `docs/EMRINNO_MIGRATION.md` for the migration and regression checklist.
