import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { FrequencyKind } from "@/lib/income/occurrences";
import type { IncomeSeriesRecord } from "@/lib/income/summary";
import { AppHeader } from "../app-header";
import { DashboardView, type RecentExpense } from "./dashboard-view";
import { BalancePanel } from "./balance-panel";
import { formatLedgerMonth, summarize, type ExpenseRecord } from "./summary";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this route; this is defense in depth.
  if (!user) {
    redirect("/login");
  }

  const [{ count: categoryCount }, { data: rows }, { data: incomeRows }] =
    await Promise.all([
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase
        .from("expenses")
        .select(
          "id, amount, expense_date, description, category_id, categories(name)",
        )
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("income_series")
        .select(
          "amount, frequency, interval_count, days_of_month, start_date, end_date, income_categories(name)",
        ),
    ]);

  const expenses = rows ?? [];
  const records: ExpenseRecord[] = expenses.map((e) => ({
    amount: Number(e.amount),
    expense_date: e.expense_date,
    category_name: e.categories?.name ?? null,
  }));
  const recent: RecentExpense[] = expenses.slice(0, 5).map((e) => ({
    id: e.id,
    description: e.description,
    expense_date: e.expense_date,
    amount: Number(e.amount),
    category_name: e.categories?.name ?? null,
  }));

  const income: IncomeSeriesRecord[] = (incomeRows ?? []).map((s) => ({
    amount: Number(s.amount),
    frequency: s.frequency as FrequencyKind,
    interval: s.interval_count,
    days_of_month: s.days_of_month,
    start_date: s.start_date,
    end_date: s.end_date,
    category_name: s.income_categories?.name ?? null,
  }));
  const balanceExpenses = records.map((e) => ({
    amount: e.amount,
    expense_date: e.expense_date,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const summary = summarize(records, today);
  const dateLabel = formatLedgerMonth(today);

  // Earliest activity anchors the "All time" period.
  const earliestDates = [
    ...income.map((i) => i.start_date),
    ...balanceExpenses.map((e) => e.expense_date),
  ].sort();
  const earliest = earliestDates[0];

  return (
    <div className="min-h-svh">
      <AppHeader email={user.email ?? ""} active="dashboard" />

      <main className="ledger-enter mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end lg:mb-10">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="bg-primary h-px w-8" />
              <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.15em] uppercase">
                Ledger overview / {dateLabel}
              </p>
            </div>
            <h1 className="font-heading text-4xl leading-none font-semibold tracking-[-0.055em] sm:text-5xl">
              Overview
            </h1>
            <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-relaxed sm:text-base">
              Welcome back. Here&apos;s where your money went.
            </p>
          </div>
          <Link href="/expenses" className={buttonVariants({ size: "lg" })}>
            Add an expense
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>

        <div className="mb-4">
          <BalancePanel
            today={today}
            earliest={earliest}
            income={income}
            expenses={balanceExpenses}
          />
        </div>

        <DashboardView
          summary={summary}
          categoryCount={categoryCount ?? 0}
          recent={recent}
        />
      </main>
    </div>
  );
}
