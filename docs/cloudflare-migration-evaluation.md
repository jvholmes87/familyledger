# FamilyLedger — Cloudflare D1 migration evaluation

**Status:** Architecture proposal only; no implementation, provisioning, deployment, or cutover authorized.
**Date:** 2026-11-14
**Branch:** `migration/cloudflare-d1-evaluation`
**Baseline:** `main` at `17b670ee19f3da5f59b62942bef6b89c2ebf680f` (2026-11-01).
**Scope:** FamilyLedger only. Forkline and Gyeoldesk infrastructure and all other repositories are unaffected.

## Decision context

FamilyLedger is paused. The owner is using their two free Supabase project slots for Forkline and Gyeoldesk and wants to evaluate a separate provider for FamilyLedger. Preserve the repository, SpendWise original-team attribution, MIT licensing, synthetic test data, and current product scope. Do not create another Supabase project, reuse the live apps' databases, or delete any resources without separately verifying ownership, data retention, and rollback needs.

Existing housekeeping PR #1 was closed unmerged on 2026-11-14 to keep it out of the open housekeeping merge queue. Do not reopen or merge it as part of this migration.

## Verified current coupling

- `package.json`: Next.js 16, React 19, `@supabase/ssr` and `@supabase/supabase-js`; Vitest and Playwright test suites.
- `src/lib/supabase/server.ts`: server client with Next.js cookies.
- `src/lib/supabase/client.ts`: browser client.
- `src/lib/supabase/middleware.ts` and root `middleware.ts`: Supabase session refresh and protected-route redirects.
- `src/app/auth/actions.ts`: sign-in, sign-up, sign-out server actions.
- `supabase/migrations/` and generated database types: PostgreSQL schema and RLS policies; inspect each migration before translating it.
- E2E `e2e/auth.spec.ts` expects signup, dashboard access and logout. Existing workflow uses two Supabase environment variables.
- Latest recorded CI on the docs PR: lint/typecheck and 183 unit tests passed; 3 E2E passed and 20 failed with unavailable Supabase configuration. This is **not** a passing release gate.

## Proposed service mapping — decisions pending proof

| Existing responsibility | Candidate | Migration/security work |
| --- | --- | --- |
| Supabase PostgreSQL | Cloudflare D1 (SQLite) | Translate schema and data types; migrate policies into application authorization; verify indexes, constraints, precision, and backup/export |
| Supabase Auth | **Undecided**: evaluate a compatible identity provider or vetted Workers-based auth library | Password handling, email verification, session rotation/revocation, CSRF, recovery, account deletion; do not write homegrown crypto |
| Supabase RLS | Server-side ownership authorization on **every** query/mutation | Derive user identity from server-validated session, never client-supplied owner IDs; reject cross-user access; regression tests |
| Supabase Storage | Cloudflare R2 **only if** file workflows require it | Private object authorization, upload validation, signed access, quotas, retention; avoid provisioning unused storage |
| Supabase SSR/browser clients | Thin typed repository and auth interfaces | Keep credentials off browser; swap dependencies incrementally behind tested server-side interfaces |
| Vercel hosting | Keep Vercel initially **or** evaluate Cloudflare Workers via vinext | Validate Next 16, Server Actions, middleware, cookies, session behavior and preview/production deployment before choosing |
| GitHub E2E secrets | Isolated D1 test database and test auth configuration | No production financial data; never disable tests to report green; no shared Forkline/Gyeoldesk credentials |

D1 is SQLite, **not** drop-in PostgreSQL. Money must remain exact (integer minor units or explicitly tested decimal representation), including multi-currency and conversions. Ensure atomic writes, idempotent imports, and consistent authorization. Verify D1 Free quotas before use: as of 2026-10-30, Free limits include 10 databases, **500 MB per database**, 5 GB aggregate account storage, and 7 days Time Travel. Recheck official docs before implementation.

## Architecture and staged implementation

1. **Inventory and decision record** (`docs:`): enumerate all Supabase imports, SQL migrations, RLS policies, file storage, auth calls and environment variables; choose and document identity-provider and hosting options after a compatibility proof. Preserve historical SpendWise phase documentation as historical record; update active engineering instructions separately only after migration approval.
2. **Contract tests first** (`test:`): create failing tests for anonymous denial, session verification, per-user record isolation, invalid/expired sessions, currency precision, schema constraints and errors; define E2E signup → dashboard → sign-out. Follow repository `AGENTS.md` TDD red/green/refactor.
3. **D1 local prototype** (`feat:`): implement an isolated adapter using local D1, SQL migrations, typed parameter binding and synthetic fixtures; avoid writing to a live database or swapping default production behavior.
4. **Authentication prototype** (`feat:`): integrate selected provider; secure cookie lifecycle and all server actions. D1 alone is **not** an authentication service. Prove cross-user denial under real browser testing.
5. **Application data migration** (`feat:`): replace Supabase repositories incrementally; test CRUD, categories, income, CSV and any future account/entity features. Use a temporary adapter choice/configuration for testing rather than enabling insecure fallback in production.
6. **CI and preview** (`ci:`): lint → typecheck → unit → E2E all pass, with isolated local/CI D1 and auth fixtures; build and preview verified with the selected deployment adapter. Document exact URLs and results.
7. **Owner review and controlled cutover** (`docs:`): record costs, privacy, data export/import strategy, rollback, deployment and recovery steps; no production publish/merge until explicit owner approval and existing review/evidence requirements are met.

## Gates and stop conditions

- No merge with failing lint, type checks, unit tests or E2E. A skipped/missing D1/auth test environment is **blocked**, not a pass.
- Do not reduce authorization protections formerly enforced by Supabase RLS.
- Never commit secrets or real household/financial data. Keep all test fixtures synthetic.
- Do not touch the other two Supabase projects, change repo visibility, rename/archive/delete repos, or alter licensing and attribution.
- Keep the closed housekeeping PR distinct. Do not create a duplicate PR or merge to main as part of this document.
- No Cloudflare account resources, migrations, or releases are performed by creating this plan.
- Review `AGENTS.md`, `CLAUDE.md`, and `docs/phase-1-prd.md` prior to implementation. The Phase 1 scope/tech-stack statements reflect the historical SpendWise phase; resolve conflicts with a versioned decision record rather than silently bypassing the project's rules.

## Official references (verified 2026-11-14)

- Cloudflare D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- Cloudflare Next.js on Workers: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Existing-app OpenNext notes: https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/

**Current outcome:** Architecture mapped; implementation remains intentionally unstarted.
