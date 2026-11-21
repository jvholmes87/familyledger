<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Test-Driven Development is mandatory (the most important rule)

**Write the test first. Watch it fail. Then write the minimum code to make it pass. Then refactor.** This applies to every unit of behavior — components, server actions, utilities, middleware, and end-to-end flows.

The loop, every time:

1. **Red** — write a failing test that describes the desired behavior.
2. **Green** — write the least code needed to make it pass.
3. **Refactor** — clean up with the test as your safety net.

Hard rules:

- **Never write implementation code before there is a failing test for it.**
- A pull request / change that adds behavior without tests is incomplete.
- Commits should show tests landing **with or just before** their implementation — never bolted on afterward.
- If you are tempted to skip a test "to save time," stop and write the test.
- E2E coverage (Playwright) is required for user-facing flows (e.g., the auth journey), not just unit tests.

If a task is ambiguous about expected behavior, define the behavior **as a test first**, then implement.

## Test layers & commands

- **Unit / component:** Vitest + Testing Library (`@testing-library/react`), jsdom.
- **End-to-end:** Playwright (`e2e/`), real browser against the dev server.
- **Gate:** `lint → typecheck → unit → e2e` must all pass before anything is considered done. CI enforces this on every PR.

```bash
pnpm dev          # local dev server
pnpm test         # unit/component (Vitest), run once
pnpm test:watch   # unit/component in watch mode (use during TDD)
pnpm test:e2e     # Playwright E2E
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm build        # production build
```

(If a script above is missing, it is being added during scaffold — align to these names.)

## Kanban implementation handoff and evidence lane

For every Kanban implementation task:

- After implementation and the normal local/CI gates pass, call `kanban_request_review` with `reviewer="reviewer"`. The existing **Review** column is the post-implementation Evidence Check lane; do not mark user-facing implementation work done directly.
- Handoff metadata must include the PR URL, feature-environment URL when available, changed files, exact commands/results, and any credentials/test-data limitations.
- The reviewer must boot the documented local application, exercise the changed user flow in a real browser, capture screenshots of the important states, and attach those screenshots plus useful safe artifacts (for example, a generated CSV excerpt or Playwright report) to the Kanban task.
- If the reviewer cannot produce browser evidence, it must add an `Evidence Check:` comment with the exact reason and continue the review. Missing optional visual evidence alone must **not** block the pipeline or trigger requested changes.
- Real defects, failed acceptance criteria, security issues, or reproducible test failures still require changes. Never turn this non-blocking evidence rule into a rubber stamp.
- For tasks without a user-visible flow, record `evidence_status: not_applicable` and review the appropriate executable artifact instead.

## Phase discipline — we are in PHASE 1 (scaffold only)

Phase 1 builds **only** the scaffold: a deployable Next.js app, Supabase auth wired through Vercel, a working **login → protected dashboard skeleton → logout** slice, the design system foundation, and the test/CI harness.

**Do NOT build in Phase 1:** expense create/edit/delete, categories, the real dashboard with data, reports, receipt parsing, CSV, or any Phase 2+ feature. See `docs/phase-1-prd.md` for the authoritative scope. When in doubt, build less.

## Tech stack (pinned)

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript 5.9** (strict)
- **Tailwind CSS 4** (CSS-first `@theme` config in `globals.css`; no `tailwind.config.js`)
- **shadcn/ui** components, restyled to the design-system tokens
- **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) — Postgres, Auth, Storage
- **pnpm** package manager
- **Vitest** + **Testing Library** + **Playwright**
- Deployed on **Vercel**; Supabase provisioned via the Vercel integration

Use the latest stable APIs for these versions. Do not downgrade. Prefer Server Components and Server Actions; keep client components minimal.

## Design system — "Calm Ledger" (do not improvise styling)

The full spec is `docs/design-system.md`. Summary you must follow:

- Warm off-white **paper** canvas, near-black warm **ink** text, a single deep **emerald** accent used sparingly, hairline **borders** over heavy shadows, generous whitespace.
- **Currency and numeric data use tabular numerals.**
- **Never hardcode hex colors in components.** Use the theme tokens (CSS variables / Tailwind theme) defined in `globals.css`. If you need a new token, add it to the theme, document it in `docs/design-system.md`, then use it.
- shadcn primitives are themed once and reused; don't fork one-off styles.
- The goal is an expert, premium, restrained finance aesthetic — deliberately not generic "AI slop" (no purple gradients, no random drop shadows).

## Security posture (from day one)

- A user may only ever access their own data. Any Supabase table is created with **RLS enabled** and `auth.uid()`-scoped policies — even before feature tables exist.
- Never commit secrets. `.env.local` is gitignored; use `.env.example` as the template. Pull real values from Vercel (`vercel env pull`).
- Use synthetic/sample data for tests and demos — never real financial data.

## Conventions

- **TypeScript strict**; no `any` without a written reason.
- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `ci:`). Commit in small, logical units; tests travel with their code.
- File layout follows `docs/phase-1-prd.md` §5. Colocate or mirror tests close to the code they cover.
- Keep changes surgical and scoped to the task. Don't refactor unrelated code.

## Required cybersecurity review

For every public or private repository change, follow [.github/SECURITY-BASELINE.md](.github/SECURITY-BASELINE.md). Run the security checks before pushing and preserve existing project approval, ownership and release rules. Never publish real credentials or private personal data, including in Git history, CI logs or artifacts. A passing scanner does not replace application or publication review.
