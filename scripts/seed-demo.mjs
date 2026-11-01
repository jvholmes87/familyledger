// Seed a demo user with realistic income + expense data so the Income feature
// and dashboard look populated. Idempotent: it wipes the demo user's rows and
// reinserts. Uses the service role key to bypass RLS and write for a specific
// user, so NEVER run this against production with real data.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   SEED_EMAIL=demo@example.com SEED_PASSWORD=demo-password-123 \
//   node scripts/seed-demo.mjs
//
// SUPABASE_URL defaults to the local stack; the service role key is required.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.SEED_EMAIL ?? "demo@example.com";
const PASSWORD = process.env.SEED_PASSWORD ?? "demo-password-123";

if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Find the demo user by email, creating them (confirmed) if absent. */
async function ensureUser() {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users.find((u) => u.email === EMAIL);
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  const userId = await ensureUser();
  console.log(`Seeding data for ${EMAIL} (${userId})`);

  // Clean slate for this user.
  for (const table of [
    "income_series",
    "income_categories",
    "expenses",
    "categories",
  ]) {
    await admin.from(table).delete().eq("user_id", userId);
  }

  // --- Income categories ---
  const incomeCategoryNames = [
    "VA Disability",
    "Housing Allowance",
    "Small Business",
    "Part-time Job",
  ];
  const { data: incomeCats, error: icErr } = await admin
    .from("income_categories")
    .insert(incomeCategoryNames.map((name) => ({ name, user_id: userId })))
    .select("id, name");
  if (icErr) throw icErr;
  const icId = Object.fromEntries(incomeCats.map((c) => [c.name, c.id]));

  // --- Income series (recurring + one-off) ---
  const series = [
    {
      name: "VA Disability",
      amount: 3737.85,
      category_id: icId["VA Disability"],
      frequency: "every_n_months",
      interval_count: 1,
      days_of_month: [],
      start_date: "2024-03-01",
      end_date: null,
    },
    {
      name: "Basic Allowance for Housing",
      amount: 2145.0,
      category_id: icId["Housing Allowance"],
      frequency: "every_n_months",
      interval_count: 1,
      days_of_month: [],
      start_date: "2024-03-01",
      end_date: null,
    },
    {
      name: "Consulting draw",
      amount: 1500.0,
      category_id: icId["Small Business"],
      frequency: "every_n_months",
      interval_count: 1,
      days_of_month: [],
      start_date: "2025-06-15",
      end_date: null,
    },
    {
      name: "Website project (one-off)",
      amount: 2800.0,
      category_id: icId["Small Business"],
      frequency: "one_time",
      interval_count: 1,
      days_of_month: [],
      start_date: "2026-06-20",
      end_date: null,
    },
    {
      name: "Retail paycheck",
      amount: 712.4,
      category_id: icId["Part-time Job"],
      frequency: "every_n_weeks",
      interval_count: 2,
      days_of_month: [],
      start_date: "2026-01-02",
      end_date: null,
    },
    {
      name: "Direct deposit (15th & last)",
      amount: 980.0,
      category_id: icId["Part-time Job"],
      frequency: "days_of_month",
      interval_count: 1,
      days_of_month: [15, 0],
      start_date: "2026-02-15",
      end_date: null,
    },
  ];
  const { error: sErr } = await admin
    .from("income_series")
    .insert(series.map((s) => ({ ...s, user_id: userId })));
  if (sErr) throw sErr;

  // --- Expense categories + expenses (so the balance panel has both sides) ---
  const expenseCategoryNames = [
    "Rent",
    "Groceries",
    "Utilities",
    "Transportation",
    "Dining",
  ];
  const { data: expCats, error: ecErr } = await admin
    .from("categories")
    .insert(expenseCategoryNames.map((name) => ({ name, user_id: userId })))
    .select("id, name");
  if (ecErr) throw ecErr;
  const ecId = Object.fromEntries(expCats.map((c) => [c.name, c.id]));

  const expenses = [
    ["Rent", 1650, "2026-07-01", "July rent"],
    ["Groceries", 142.38, "2026-07-03", "Weekly shop"],
    ["Utilities", 96.4, "2026-07-05", "Electric"],
    ["Transportation", 58.0, "2026-07-06", "Gas"],
    ["Dining", 41.25, "2026-07-08", "Dinner out"],
    ["Groceries", 121.9, "2026-07-11", "Weekly shop"],
    ["Dining", 28.5, "2026-07-12", "Coffee & lunch"],
    ["Transportation", 62.3, "2026-07-13", "Gas"],
    ["Rent", 1650, "2026-06-01", "June rent"],
    ["Groceries", 155.2, "2026-06-04", "Weekly shop"],
    ["Utilities", 88.75, "2026-06-06", "Electric"],
    ["Dining", 73.6, "2026-06-14", "Anniversary dinner"],
    ["Transportation", 60.0, "2026-06-20", "Gas"],
    ["Groceries", 133.11, "2026-06-25", "Weekly shop"],
    ["Rent", 1650, "2026-05-01", "May rent"],
    ["Utilities", 91.2, "2026-05-06", "Electric"],
    ["Groceries", 148.05, "2026-05-09", "Weekly shop"],
    ["Dining", 52.4, "2026-05-18", "Brunch"],
  ];
  const { error: eErr } = await admin.from("expenses").insert(
    expenses.map(([cat, amount, date, description]) => ({
      user_id: userId,
      category_id: ecId[cat],
      amount,
      expense_date: date,
      description,
    })),
  );
  if (eErr) throw eErr;

  console.log(
    `Seeded ${series.length} income sources, ${incomeCategoryNames.length} income categories, and ${expenses.length} expenses.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
