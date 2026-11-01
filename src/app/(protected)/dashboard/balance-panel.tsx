"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MoneyAmount } from "@/components/money-amount";
import { incomeInRange, type IncomeSeriesRecord } from "@/lib/income/summary";
import {
  PERIOD_OPTIONS,
  resolvePeriod,
  expenseTotalInRange,
  balance,
  type PeriodId,
} from "@/lib/income/period";
import { cn } from "@/lib/utils";

type ExpenseRow = { amount: number; expense_date: string };

const STATUS = {
  over: {
    label: "Over",
    tone: "text-positive",
    chip: "border-positive/25 bg-positive/10 text-positive",
    describe: (money: string) =>
      `You're bringing in ${money} more than you spend.`,
  },
  under: {
    label: "Under",
    tone: "text-negative",
    chip: "border-negative/25 bg-negative/10 text-negative",
    describe: (money: string) => `You're spending ${money} more than you earn.`,
  },
  breakeven: {
    label: "Break-even",
    tone: "text-muted-foreground",
    chip: "border-border bg-paper-deep/60 text-muted-foreground",
    describe: () => "Your income and spending are balanced.",
  },
} as const;

/**
 * Income-vs-expenses comparison with a period selector. Recomputes entirely in
 * the browser from the full record sets as the period changes, so no round trip
 * is needed. All aggregation is delegated to the pure period/summary helpers.
 */
export function BalancePanel({
  today,
  earliest,
  income,
  expenses,
}: {
  today: string;
  earliest?: string;
  income: IncomeSeriesRecord[];
  expenses: ExpenseRow[];
}) {
  const [period, setPeriod] = useState<PeriodId>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { incomeTotal, expenseTotal, net, status } = useMemo(() => {
    const range = resolvePeriod(period, today, {
      earliest,
      customStart,
      customEnd,
    });
    const incomeTotal = incomeInRange(income, range.start, range.end).total;
    const expenseTotal = expenseTotalInRange(expenses, range);
    const { net, status } = balance(incomeTotal, expenseTotal);
    return { incomeTotal, expenseTotal, net, status };
  }, [period, customStart, customEnd, today, earliest, income, expenses]);

  const meta = STATUS[status];
  const absMoney = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(net));

  return (
    <Card
      role="region"
      aria-label="Income vs. expenses"
      className="border-transparent"
    >
      <CardHeader className="border-border border-b pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
              Balance / 00
            </p>
            <h2 className="font-heading mt-2 text-2xl leading-none font-semibold tracking-[-0.04em]">
              Income vs. expenses
            </h2>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="balance-period" className="sr-only">
              Period
            </Label>
            <Select
              id="balance-period"
              aria-label="Period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodId)}
              className="sm:w-48"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {period === "custom" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="balance-from">From</Label>
              <input
                id="balance-from"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border-input bg-paper-raised h-11 rounded-lg border px-3.5 text-sm outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="balance-to">To</Label>
              <input
                id="balance-to"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border-input bg-paper-raised h-11 rounded-lg border px-3.5 text-sm outline-none"
              />
            </div>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <CardDescription className="font-data text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
              Income
            </CardDescription>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              <MoneyAmount value={incomeTotal} />
            </p>
          </div>
          <div>
            <CardDescription className="font-data text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
              Expenses
            </CardDescription>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              <MoneyAmount value={expenseTotal} />
            </p>
          </div>
          <div>
            <CardDescription className="font-data text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
              Net
            </CardDescription>
            <p
              className={cn(
                "mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl",
                meta.tone,
              )}
            >
              <MoneyAmount value={net} showSign />
            </p>
          </div>
        </div>

        <div className="border-border mt-6 flex flex-wrap items-center gap-3 border-t pt-5">
          <span
            className={cn(
              "font-data inline-flex items-center rounded-full border px-3 py-1 text-[0.6875rem] font-bold tracking-[0.08em] uppercase",
              meta.chip,
            )}
          >
            {meta.label}
          </span>
          <p className="text-muted-foreground text-sm">
            {meta.describe(absMoney)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
