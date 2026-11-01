import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MoneyAmount } from "@/components/money-amount";
import type { DashboardSummary } from "./summary";

export type RecentExpense = {
  id: string;
  description: string | null;
  expense_date: string;
  amount: number;
  category_name: string | null;
};

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
  trailingZeroDisplay: "stripIfInteger",
});

/** Round a value up to a "nice" axis maximum (1/2/2.5/5/10 × 10ⁿ). */
function niceCeil(value: number): number {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const nice =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10;
  return nice * magnitude;
}

const monthLong = (month: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));

function TrendChart({ trend }: { trend: DashboardSummary["trend"] }) {
  const axisMax = niceCeil(Math.max(...trend.map((t) => t.total)));
  // Tick fractions from top (100%) down to the baseline (0%).
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((f) => f * axisMax);

  return (
    <>
      <div className="flex gap-2 sm:gap-3">
        <div
          className="flex h-56 flex-col justify-between pb-6 text-right"
          aria-hidden="true"
        >
          {ticks.map((value, i) => (
            <span
              key={i}
              className="text-muted-foreground font-data text-[0.5625rem] leading-none tabular-nums"
            >
              {usdCompact.format(value)}
            </span>
          ))}
        </div>

        <div className="relative h-56 flex-1">
          {/* Gridlines aligned to the axis ticks. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between"
          >
            {ticks.map((_, i) => (
              <div key={i} className="border-border/70 border-t" />
            ))}
          </div>

          <div
            className="absolute inset-x-0 top-0 bottom-6 flex items-end gap-2 sm:gap-3"
            aria-hidden="true"
          >
            {trend.map((t) => {
              const full = usd.format(t.total);
              const heightPct =
                axisMax === 0
                  ? 0
                  : Math.max(t.total === 0 ? 0 : 3, (t.total / axisMax) * 100);
              return (
                <div
                  key={t.month}
                  className="group relative flex h-full flex-1 items-end px-0.5 sm:px-1.5"
                >
                  {/* Value revealed on hover/focus, pinned just above the bar. */}
                  <span
                    className="border-border bg-card text-foreground font-data pointer-events-none absolute inset-x-0 z-10 mx-auto w-max -translate-y-1 rounded-md border px-1.5 py-0.5 text-center text-[0.625rem] font-semibold tabular-nums opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                    style={{ bottom: `${heightPct}%` }}
                  >
                    {full}
                  </span>
                  <div
                    title={`${monthLong(t.month)}: ${full}`}
                    className="bg-primary/85 group-hover:bg-primary w-full rounded-t-md transition-colors duration-200"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Month labels along the baseline. */}
          <div className="absolute inset-x-0 bottom-0 flex h-6 items-center gap-2 sm:gap-3">
            {trend.map((t) => (
              <span
                key={t.month}
                className="text-muted-foreground flex-1 text-center font-mono text-[0.625rem] font-medium uppercase"
              >
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  timeZone: "UTC",
                }).format(new Date(`${t.month}-01T00:00:00Z`))}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ul className="sr-only">
        {trend.map((entry) => (
          <li key={entry.month}>
            {`${monthLong(entry.month)}: ${usd.format(entry.total)}`}
          </li>
        ))}
      </ul>
    </>
  );
}

export function DashboardView({
  summary,
  categoryCount,
  recent,
}: {
  summary: DashboardSummary;
  categoryCount: number;
  recent: RecentExpense[];
}) {
  const { monthTotal, monthOverMonthDelta, byCategory, trend } = summary;
  const categoryMax = Math.max(1, ...byCategory.map((c) => c.total));

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
        <Card
          role="group"
          aria-label="This month"
          className="bg-primary text-primary-foreground shadow-ledger-float relative overflow-hidden border-transparent md:col-span-2 lg:col-span-6"
        >
          <div
            aria-hidden="true"
            className="border-primary-foreground/12 absolute inset-y-0 left-7 w-px border-l"
          />
          <div
            aria-hidden="true"
            className="font-heading text-primary-foreground/[0.045] pointer-events-none absolute -right-2 -bottom-14 text-[11rem] leading-none font-bold"
          >
            01
          </div>
          <CardHeader className="relative pl-10">
            <CardDescription className="text-primary-foreground/75 font-data text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
              This month / Current balance
            </CardDescription>
            <CardTitle className="mt-2 text-5xl leading-none font-semibold tracking-[-0.06em] sm:text-6xl">
              <MoneyAmount
                value={monthTotal}
                className="text-primary-foreground"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-primary-foreground/78 relative flex items-center justify-between gap-4 pl-10 text-sm">
            <span>Total spending in the current month.</span>
            <span className="font-data hidden text-[0.625rem] tracking-[0.1em] uppercase sm:inline">
              Month to date
            </span>
          </CardContent>
        </Card>

        <Card role="group" aria-label="Categories" className="lg:col-span-3">
          <CardHeader className="h-full">
            <div className="flex items-start justify-between gap-4">
              <CardDescription className="font-data text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
                Categories
              </CardDescription>
              <span className="border-border text-muted-foreground grid size-7 place-items-center rounded-full border font-mono text-[0.5625rem]">
                02
              </span>
            </div>
            <CardTitle className="mt-3 text-5xl leading-none tabular-nums">
              {categoryCount}
            </CardTitle>
            <CardDescription className="mt-auto pt-5">
              Expense categories
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <Link
              href="/categories"
              className="text-primary decoration-primary/25 hover:decoration-primary font-semibold underline underline-offset-4 transition-colors"
            >
              Manage categories
            </Link>
          </CardContent>
        </Card>

        <Card
          role="group"
          aria-label="vs. last month"
          className="lg:col-span-3"
        >
          <CardHeader className="h-full">
            <div className="flex items-start justify-between gap-4">
              <CardDescription className="font-data text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
                vs. last month
              </CardDescription>
              <span className="border-border text-muted-foreground grid size-7 place-items-center rounded-full border font-mono text-[0.5625rem]">
                03
              </span>
            </div>
            <CardTitle className="mt-3 text-4xl leading-none">
              <MoneyAmount value={monthOverMonthDelta} showSign />
            </CardTitle>
            <CardDescription className="mt-auto pt-5">
              Net monthly movement
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm leading-relaxed">
            Change from the previous month.
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="min-w-0">
          <CardHeader className="border-border border-b pb-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
                  Movement / 04
                </p>
                <h2 className="font-heading mt-2 text-2xl leading-none font-semibold tracking-[-0.04em]">
                  Spending over time
                </h2>
              </div>
              <CardDescription className="shrink-0">
                Last {trend.length} months
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <TrendChart trend={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-border border-b pb-5">
            <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
              Distribution / 05
            </p>
            <h2 className="font-heading mt-2 text-2xl leading-none font-semibold tracking-[-0.04em]">
              By category
            </h2>
            <CardDescription className="mt-1">This month</CardDescription>
          </CardHeader>
          <CardContent className="pt-1">
            {byCategory.length > 0 ? (
              <ul className="flex flex-col gap-5">
                {byCategory.map((c, index) => (
                  <li key={c.name} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2.5 font-semibold">
                        <span
                          aria-hidden="true"
                          className="font-data text-muted-foreground text-[0.5625rem]"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate">{c.name}</span>
                      </span>
                      <MoneyAmount
                        value={c.total}
                        className="font-data text-xs font-semibold"
                      />
                    </div>
                    <div className="bg-paper-deep h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${Math.round((c.total / categoryMax) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="border-border bg-paper-deep/35 rounded-xl border border-dashed px-4 py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No spending recorded this month.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="border-border border-b pb-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
                Latest entries / 06
              </p>
              <h2 className="font-heading mt-2 text-2xl leading-none font-semibold tracking-[-0.04em]">
                Recent activity
              </h2>
            </div>
            <Link
              href="/expenses"
              className="text-primary decoration-primary/25 hover:decoration-primary text-xs font-semibold underline underline-offset-4"
            >
              View all expenses
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {recent.length > 0 ? (
            <ul className="divide-border divide-y">
              {recent.map((e, index) => (
                <li
                  key={e.id}
                  className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3 py-4 sm:grid-cols-[2rem_minmax(0,1fr)_9rem_7rem_7rem] sm:gap-4"
                >
                  <span
                    aria-hidden="true"
                    className="font-data text-muted-foreground text-[0.5625rem]"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {e.description ?? "—"}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs sm:hidden">
                      <time dateTime={e.expense_date}>{e.expense_date}</time> ·{" "}
                      {e.category_name ?? "Uncategorized"}
                    </p>
                  </div>
                  <p className="text-muted-foreground hidden truncate text-xs sm:block">
                    {e.category_name ?? "Uncategorized"}
                  </p>
                  <time
                    dateTime={e.expense_date}
                    className="text-muted-foreground hidden text-right font-mono text-[0.625rem] sm:block"
                  >
                    {e.expense_date}
                  </time>
                  <MoneyAmount
                    value={e.amount}
                    className="font-data text-right text-xs font-semibold"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="border-border bg-paper-deep/35 rounded-xl border border-dashed px-5 py-10 text-center">
              <p className="text-muted-foreground text-sm">
                No expenses yet.{" "}
                <Link
                  href="/expenses"
                  className="text-primary decoration-primary/25 hover:decoration-primary font-semibold underline underline-offset-4"
                >
                  Add your first one
                </Link>
                .
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
