# SpendWise — Phase 1 PRD (Scaffold & Auth Skeleton)

**Course:** UMGC CMSC 495 6980 — Computer Science Capstone (Summer 2026)
**Team:** Leighton Tidwell, Jason Holmes, Eric Hill
**Phase 1 target (course Week 4 deliverable):** Create the GitHub repository, scaffold the Next.js application, configure Supabase, establish authentication, and deploy an early version to Vercel.
**Status:** ✅ Complete — delivered June 2026. Auth skeleton live, tests + CI green, deployed to Vercel (public at the production domain), repo on GitHub (team invited) with branch protection on `main`.

---

## 1. Purpose

This document is the execution plan for Phase 1 of SpendWise. Phase 1 is _only_ the scaffold: a deployable Next.js app, Supabase wired up as the backend through Vercel, a working login/logout skeleton behind a protected route, the reusable design system foundation, and the test/CI harness — all built test-first (TDD).

We are **not** building expense CRUD, categories, or the real dashboard in Phase 1. Those are Phase 2 (course Weeks 5–6). Phase 1 proves the architecture end to end with the thinnest possible vertical slice: a user can sign up, log in, land on a protected dashboard skeleton, and log out, with the whole thing deployed on Vercel and covered by tests.

## 2. Source Context

This PRD is derived from the team's submitted project plan and Unit 2 discussion. Relevant requirement IDs from the project plan that Phase 1 touches:

- **FR-01** — register, log in, log out securely; protected pages only after auth. _(Phase 1 core)_
- **FR-07** — usable on desktop and mobile browsers. _(Phase 1 establishes responsive shell)_
- **FR-08** — use sample/synthetic data for dev and testing. _(Phase 1 establishes the convention)_
- **BR-03 / NFR-06** — a logged-in user can only access their own data (row-level security foundation). _(Phase 1 establishes RLS posture even before expense tables exist)_
- **NFR-01** — Next.js frontend. _(see Decision D1: TypeScript)_
- **NFR-02** — Supabase backend (Postgres, auth, storage).
- **NFR-03** — deployed via Vercel.
- **NFR-04** — GitHub source control, shared with the team.
- **NFR-05** — runs in modern browsers.

Phase 2+ requirements (FR-02..06, BR-01/02, categories, dashboard) are explicitly **out of scope** here.

## 3. Confirmed Decisions

| ID  | Decision                                                                                                                            | Rationale                                                                                                                                                                                                                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **TypeScript** (not plain JS)                                                                                                       | Type safety makes TDD and refactoring far safer; modern default. Noted in README as a refinement of NFR-01 (TS compiles to JS).                                                                                                                                                                                                                |
| D2  | **Design theme: "Calm Ledger"**                                                                                                     | Warm off-white paper canvas, near-black warm ink, single deep-emerald accent, generous whitespace, borders over heavy shadows, tabular numerals for money. Restrained, premium, finance-appropriate; deliberately not the generic purple-gradient look. Captured as reusable tokens + `docs/design-system.md` and referenced from `AGENTS.md`. |
| D3  | **Package manager: pnpm**                                                                                                           | Already installed (v10), fast, disk-efficient, deterministic.                                                                                                                                                                                                                                                                                  |
| D4  | **Testing: Vitest + Testing Library (unit/component), Playwright (E2E)**                                                            | "vite" in the goal → Vitest. TDD requires fast unit tests + real-browser E2E for the auth flow.                                                                                                                                                                                                                                                |
| D5  | **Auth: Supabase Auth via `@supabase/ssr`** (cookie-based sessions, App Router)                                                     | Canonical Next.js App Router + Supabase pattern; SSR-safe session handling via middleware.                                                                                                                                                                                                                                                     |
| D6  | **Supabase provisioned through the Vercel Marketplace integration**                                                                 | Matches the goal ("setup supabase in vercel"); auto-injects env vars into Vercel. Local dev uses pulled env vars.                                                                                                                                                                                                                              |
| D7  | **`CLAUDE.md` is a symlink to `AGENTS.md`**                                                                                         | One source of truth, readable by any agent toolchain.                                                                                                                                                                                                                                                                                          |
| D8  | **Pre-commit hook (Husky + lint-staged)** runs Prettier (format), ESLint (lint), and `tsc --noEmit` (typecheck) before every commit | No unformatted, lint-broken, or type-broken code ever enters history; catches issues locally before CI runs.                                                                                                                                                                                                                                   |

## 4. Tech Stack & Pinned Versions (latest as of 2026-06-20)

| Package                | Version    | Notes                                                                       |
| ---------------------- | ---------- | --------------------------------------------------------------------------- |
| next                   | 16.2.9     | App Router, Turbopack                                                       |
| react / react-dom      | 19.2.4     | version pinned by create-next-app for Next 16 compatibility                 |
| typescript             | 5.9.3      | strict mode (TS 6 is days old; holding for Next 16 toolchain compatibility) |
| tailwindcss            | 4.3.1      | CSS-first config (`@theme` in CSS; no `tailwind.config.js` needed)          |
| shadcn/ui              | latest CLI | components restyled to Calm Ledger tokens                                   |
| @supabase/supabase-js  | 2.108.2    |                                                                             |
| @supabase/ssr          | 0.12.0     | cookie-based SSR auth                                                       |
| vitest                 | 4.1.9      | unit/component runner                                                       |
| @testing-library/react | 16.3.2     | component tests                                                             |
| @playwright/test       | 1.61.0     | E2E                                                                         |
| eslint                 | 9.39.4     | flat config (eslint-config-next 16 targets ESLint 9)                        |
| prettier               | latest     | formatting (enforced via pre-commit hook)                                   |
| husky                  | latest     | git hooks manager                                                           |
| lint-staged            | latest     | run Prettier/ESLint on staged files in pre-commit                           |

## 5. Target Architecture

```
spendwise/
├── AGENTS.md                  # agent rules (TDD-first, design system); CLAUDE.md -> symlink
├── CLAUDE.md                  # -> AGENTS.md (symlink)
├── README.md                  # architecture overview, setup, scripts
├── docs/
│   ├── phase-1-prd.md         # this file
│   └── design-system.md       # Calm Ledger spec (tokens, type, components)
├── e2e/                       # Playwright specs
│   └── auth.spec.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx         # root layout, fonts, theme
│   │   ├── page.tsx           # marketing/landing or redirect
│   │   ├── globals.css        # Tailwind 4 @theme tokens (Calm Ledger)
│   │   ├── login/page.tsx     # login + signup UI
│   │   ├── auth/
│   │   │   ├── callback/route.ts   # Supabase auth code exchange
│   │   │   └── actions.ts          # server actions: signIn, signUp, signOut
│   │   └── (protected)/
│   │       └── dashboard/page.tsx  # protected skeleton
│   ├── components/
│   │   └── ui/                # shadcn components (themed)
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts      # browser client
│   │       ├── server.ts      # server client (cookies)
│   │       └── middleware.ts  # session refresh helper
│   └── test/
│       ├── setup.ts           # Vitest + RTL setup
│       └── *.test.tsx         # colocated/unit tests
├── middleware.ts              # protects (protected) routes, refreshes session
├── supabase/                  # supabase CLI project (migrations, config)
│   └── migrations/
├── .github/workflows/ci.yml   # lint + typecheck + unit + e2e on PR
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.mjs
├── .env.local                 # NOT committed (pulled from Vercel)
└── .env.example               # committed template
```

**Auth flow (skeleton):**

1. Unauthenticated user hits `/dashboard` → `middleware.ts` redirects to `/login`.
2. `/login` posts to a server action (`signIn`/`signUp`) using the server Supabase client.
3. Supabase sets the session cookie; middleware refreshes it on each request.
4. Authenticated user reaching `/login` is redirected to `/dashboard`.
5. `signOut` server action clears the session → back to `/login`.

**Data/security posture:** No expense tables yet, but we establish the RLS convention now — any future table is created with RLS enabled and `auth.uid()`-scoped policies (satisfies BR-03 / NFR-06 from day one).

## 6. Design System — "Calm Ledger" (summary; full spec in `docs/design-system.md`)

- **Canvas:** warm off-white paper (`--background`), cards a touch lighter/white.
- **Ink:** near-black, slightly warm (`--foreground`); muted warm gray for secondary text.
- **Accent:** deep emerald (`--primary`) used sparingly for primary actions and positive emphasis.
- **Semantic:** restrained positive (emerald) / negative (warm red) for money deltas.
- **Type:** modern sans (Geist Sans) for UI; **tabular numerals** for all currency. Large, confident numeric scale on the dashboard.
- **Shape & depth:** ~10–12px radius, hairline borders preferred over heavy shadows.
- **Motion:** subtle, fast (150–200ms).
- **Implementation:** tokens defined once in `globals.css` via Tailwind 4 `@theme`; shadcn components consume the tokens so the theme is reusable across all future phases. No inline hex values in components.

## 7. TDD Workflow (non-negotiable, enforced via AGENTS.md)

For every unit of behavior: **write the failing test first → run it red → write the minimum code to pass → run it green → refactor.** Commits should show tests landing with (or just before) their implementation, never long after.

**Test layers:**

- **Unit/component (Vitest + Testing Library):** form rendering/validation, server-action input handling (mocked Supabase), redirect logic, component states.
- **E2E (Playwright):** the real auth journey — sign up → land on dashboard → sign out → redirected to login; and the guard — visiting `/dashboard` while logged out redirects to `/login`. E2E runs against a local dev server with a Supabase test project/local Supabase.
- **CI gate:** `lint → typecheck → unit → e2e` must pass on every PR before merge.

## 8. Workstream Breakdown (for parallel execution after confirmation)

Dependencies require **Stream A first**, then **B and C in parallel**, then **D**, with **E** running alongside. Each stream is sized for a subagent and ends at a logical commit boundary.

### Stream A — Project & tooling foundation _(blocking; do first)_

- A1. `create-next-app` (TS, App Router, Tailwind 4, src dir, ESLint) via pnpm.
- A2. Add Prettier, finalize ESLint flat config, `.editorconfig`, `.gitignore`, `.env.example`.
- A3. Vitest + Testing Library + jsdom config; sample passing smoke test.
- A4. Playwright install + config; smoke E2E (`/` loads).
- A5. `package.json` scripts: `dev build start lint typecheck format test test:watch test:e2e`.
- A6. **Pre-commit hook (Husky + lint-staged):** on commit, run Prettier + ESLint (`--fix`) on staged files and `tsc --noEmit` typecheck; block the commit if any fail.
- A7. GitHub Actions CI (`lint`, `typecheck`, `test`, `test:e2e`).
- **Commits:** `chore: scaffold next app`, `chore: add prettier + pre-commit hook`, `chore: add vitest+testing-library`, `chore: add playwright`, `ci: add lint/test workflow`.

### Stream B — Design system "Calm Ledger" _(after A)_

- B1. Define Tailwind 4 `@theme` tokens in `globals.css` (Calm Ledger palette, radius, fonts, tabular-nums utility).
- B2. Wire Geist Sans; base typography.
- B3. `shadcn init` + add Button, Input, Label, Card; restyle to tokens.
- B4. Write `docs/design-system.md`.
- B5. Component tests for the themed primitives (render + variant states).
- **Commits:** `feat: add calm ledger design tokens`, `feat: themed shadcn primitives`, `docs: design system`.

### Stream C — Supabase + auth plumbing _(after A; needs user manual setup, see §9)_

- C1. Install `@supabase/supabase-js` + `@supabase/ssr`; browser/server clients + middleware helper.
- C2. `middleware.ts` route protection + session refresh.
- C3. Server actions: `signUp`, `signIn`, `signOut`; `/auth/callback` route.
- C4. Supabase CLI project init; RLS convention documented; (no app tables yet).
- C5. Unit tests for clients/actions/middleware with Supabase mocked (test-first).
- **Commits:** `feat: supabase clients + middleware`, `feat: auth server actions`, `test: auth unit coverage`.

### Stream D — Auth UI + login skeleton _(after B + C)_

- D1. `/login` page: sign-in/sign-up forms (themed), validation, error states.
- D2. `(protected)/dashboard` skeleton page (greeting + sign-out; placeholder summary cards using the design system, no real data).
- D3. Landing `/` (brief intro → CTA to login, or redirect).
- D4. Component tests (forms, validation, redirects) + Playwright E2E for the full journey + the guard.
- **Commits:** `feat: login/signup UI`, `feat: protected dashboard skeleton`, `test: auth e2e`.

### Stream E — Docs & agent config _(alongside)_

- E1. `AGENTS.md` (TDD-first rules, design-system reference, stack, scripts, conventions) + `CLAUDE.md` symlink.
- E2. `README.md` (architecture, setup, env, scripts, deploy, how to contribute for classmates).
- **Commits:** `docs: AGENTS.md + claude symlink`, `docs: README architecture`.

### Final — Deploy & share

- F1. `vercel link` + first deploy; confirm preview/prod loads and login works against Supabase.
- F2. Push to GitHub; add classmates (Jason, Eric) as collaborators.
- F3. Tag/checkpoint the Phase 1 baseline.

## 9. Manual Steps Required From You

These need your accounts/permission and can't be done headlessly:

1. **Vercel login:** run `vercel login` in the terminal (suggest `! vercel login` here) so the CLI is authenticated for `vercel link` / deploy.
2. **Supabase via Vercel:** provisioning the Supabase Marketplace integration is done in the Vercel dashboard (OAuth approval). I'll tell you exactly when and walk you through it; it auto-injects `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` into the project, which I then `vercel env pull` locally.
3. **GitHub repo creation & sharing:** I can create the repo with `gh` (you're authed as `leighton-tidwell`) and add Jason/Eric as collaborators — I'll need their GitHub usernames.
4. **Supabase CLI (optional, for local DB/E2E):** install `supabase` CLI (`brew install supabase/tap/supabase`) if we want local Supabase for E2E; otherwise E2E runs against a hosted test project.

## 10. Phase 1 Acceptance Criteria

Phase 1 is done when **all** hold:

- [x] App scaffolded on Next 16 / React 19 / TS / Tailwind 4, runs locally via `pnpm dev`.
- [x] Calm Ledger tokens in place; primitives themed; `docs/design-system.md` written.
- [x] Supabase wired; env in `.env.local`; clients/middleware working. _(Provisioned via the Supabase CLI in the "TDWL Dev" org rather than the Vercel Marketplace integration — see §9 note — to avoid the integration's free-tier project cap. Env vars set manually in Vercel.)_
- [x] A user can **sign up, log in, see a protected dashboard skeleton, and log out**. _(Verified by Playwright E2E against live Supabase; requires "Confirm email" off on the dev project.)_
- [x] Visiting `/dashboard` while logged out redirects to `/login`.
- [x] Unit/component tests + Playwright auth E2E all green; CI passes on PR. _(24 unit + 4 E2E; GitHub Actions `verify` job green.)_
- [x] Pre-commit hook blocks commits that fail Prettier, ESLint, or typecheck.
- [x] `AGENTS.md` (+ `CLAUDE.md` symlink) and `README.md` complete and accurate.
- [x] Deployed to Vercel (production, Ready) and publicly reachable at the production domain (`spendwise-blue-seven.vercel.app`); login works in the deployed env. _(Bare per-deployment hash URLs are protected by Vercel's default, which is expected; the production domain is public.)_
- [x] Repo on GitHub (private), pushed, connected to Vercel for auto-deploy, with branch protection on `main` (PR + `verify` CI + 1 approval; admin-overridable). Jason & Eric invited; Supabase URL + anon key shared with the team for local dev.
- [x] History is a clean sequence of logical commits.

## 11. Risks & Mitigations

| Risk                                                          | Mitigation                                                                                                                    |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Next 16 + Tailwind 4 + shadcn version friction (all very new) | Lean on the Vercel `nextjs`/`shadcn` skills during execution; pin versions; smoke-test after scaffold before building on top. |
| Supabase SSR cookie/session edge cases in App Router          | Follow the canonical `@supabase/ssr` middleware pattern; cover with unit + E2E tests.                                         |
| E2E needing real Supabase                                     | Use a dedicated Supabase test project (or local Supabase CLI); keep test creds in CI secrets, never committed.                |
| Manual Vercel/Supabase steps block automation                 | Clearly flagged in §9; I pause only at those exact points and tell you precisely what to click/run.                           |
| TS choice vs plan's "JavaScript" wording                      | Documented in README as a deliberate refinement; TS compiles to JS, so NFR-01 intent holds.                                   |

---

**Next step:** review and confirm (or request changes). On approval I'll execute Stream A first, then parallelize B/C, then D, committing logically and pausing only at the manual checkpoints in §9.
