# FamilyLedger

A household and small-business finance application with public source and private user financial data, run with a small team of AI agents and one human approver. FamilyLedger is the product version of **SpendWise**, a personal expense tracker built for UMGC CMSC 495 (Summer 2026).

> **Status:** baseline import. This repository starts from the SpendWise code at commit `754c558` (Phase 2: authentication, expense CRUD, income and category management, dashboard, CSV import, row-level security). FamilyLedger work (accounts and entities, multi-currency, budgets, statement import, the agent operating layer) lands in later commits. All data in this repository, its tests, screenshots and demo is synthetic.

## Credits

SpendWise was designed and built by **Leighton Tidwell**, **Jason Holmes** and **Eric Hill** for UMGC CMSC 495. Their work is the foundation of this repository and is published here with their consent. FamilyLedger extensions are by Jason Holmes.

## Tech stack

| Layer           | Choice                                                                       |
| --------------- | ---------------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack), React 19                                 |
| Language        | TypeScript 5.9 (strict)                                                      |
| Styling         | Tailwind CSS 4 (CSS-first `@theme`) + shadcn/ui, Bricolage Grotesque + Geist |
| Backend         | Supabase (Postgres, Auth, Storage) via `@supabase/ssr`                       |
| Hosting         | Vercel                                                                       |
| Tests           | Vitest + Testing Library (unit/component), Playwright (E2E)                  |
| Quality         | ESLint, Prettier, Husky + lint-staged pre-commit hook                        |
| Package manager | pnpm                                                                         |

> The CMSC 495 project plan lists the frontend as "Next.js with JavaScript"; we use **TypeScript** as a refinement (it compiles to JavaScript) for type safety and safer TDD.

## Architecture

```
src/
├── app/
│   ├── page.tsx              # landing page
│   ├── login/                # login/signup UI (client AuthForm)
│   ├── (protected)/
│   │   ├── dashboard/        # spending by category & over time, income vs. expenses
│   │   ├── expenses/         # expense CRUD (form, list, edit, server actions)
│   │   ├── income/           # recurring/one-off income series + frequency editor
│   │   ├── categories/       # unified expense + income category management
│   │   └── app-header.tsx    # shared responsive nav
│   ├── auth/
│   │   ├── actions.ts        # signIn / signUp / signOut server actions
│   │   ├── credentials.ts    # form validation (pure, tested)
│   │   └── callback/route.ts # OAuth / email code exchange
│   └── globals.css           # Calm Ledger design tokens (@theme)
├── components/
│   ├── ui/                   # shadcn primitives (themed)
│   └── money-amount.tsx      # currency primitive (tabular nums)
├── lib/
│   ├── income/               # pure income logic (frequency, occurrences, summary)
│   └── supabase/
│       ├── client.ts         # browser client
│       ├── server.ts         # server client (cookies)
│       ├── middleware.ts     # session refresh
│       └── route-guard.ts    # pure auth-redirect logic (tested)
└── middleware.ts             # protects routes, refreshes session
```

**Auth flow:** `middleware.ts` refreshes the Supabase session on every request and redirects unauthenticated users away from `/dashboard` (and authenticated users away from `/login`) via the pure `resolveAuthRedirect` helper. Sign-in/up go through server actions; sessions are cookie-based.

**Design system — "Calm Ledger":** archival paper, green-black ink, a single deep-forest accent, Bricolage display type, folio/index details, hairline borders, and tabular numerals for money. Tokens live once in `globals.css`; components consume them (no hardcoded colors). Full spec: [`docs/design-system.md`](docs/design-system.md).

## Getting started

```bash
pnpm install

# Supabase credentials (URL + anon key). Either:
#   cp .env.example .env.local   # then fill in values, or
#   vercel env pull .env.local   # if linked to the Vercel project
pnpm dev                          # http://localhost:3000
```

## Scripts

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `pnpm dev`        | Start the dev server                  |
| `pnpm build`      | Production build                      |
| `pnpm test`       | Unit/component tests (Vitest)         |
| `pnpm test:watch` | Vitest in watch mode (use during TDD) |
| `pnpm test:e2e`   | Playwright E2E                        |
| `pnpm lint`       | ESLint                                |
| `pnpm typecheck`  | `tsc --noEmit`                        |
| `pnpm format`     | Prettier write                        |

## Testing & TDD

This project is **test-driven**: write the failing test first, make it pass, then refactor. Unit/component tests cover pure logic and components; Playwright covers the auth journey end-to-end. A pre-commit hook runs Prettier, ESLint, and typecheck; CI runs lint + typecheck + unit + E2E on every PR. See [`AGENTS.md`](AGENTS.md) for the full working agreement (also linked as `CLAUDE.md`).

> The sign-up E2E happy path requires the Supabase project to auto-confirm emails (Authentication → Email → "Confirm email" off) so sign-up creates a session immediately.

## Deployment

Hosted on Vercel. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel project (and as GitHub Actions secrets for CI E2E).

## Database & migrations

Supabase config lives in `supabase/`. Schema changes are SQL migrations under `supabase/migrations/` (expenses, categories, income, and default-category seeding), every table with **Row Level Security** enabled and `auth.uid()`-scoped policies so a user only ever sees their own data.

## License

[MIT](LICENSE) © 2026 Leighton Tidwell, Jason Holmes, and Eric Hill.
