/**
 * Dashboard period selection and the income-vs-expenses comparison. Pure and
 * framework-free so the balance panel can recompute in the browser as the user
 * changes the period, and so it is unit-testable.
 */

export type PeriodId =
  | "this_month"
  | "last_3_months"
  | "last_6_months"
  | "last_12_months"
  | "all_time"
  | "custom";

export type PeriodRange = { start: string; end: string };

export const PERIOD_OPTIONS: { id: PeriodId; label: string }[] = [
  { id: "this_month", label: "This month" },
  { id: "last_3_months", label: "Last 3 months" },
  { id: "last_6_months", label: "Last 6 months" },
  { id: "last_12_months", label: "Last 12 months" },
  { id: "all_time", label: "All time" },
  { id: "custom", label: "Custom range" },
];

const isIsoDate = (v: string | undefined): v is string =>
  !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** First day (yyyy-mm-01) of the month `delta` months from `iso`'s month. */
function monthStart(iso: string, delta = 0): string {
  const [y, m] = iso.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  const year = Math.floor(idx / 12);
  const month = (idx % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/** Last day of the month containing `iso`. */
function monthEnd(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export function resolvePeriod(
  period: PeriodId,
  today: string,
  opts: { earliest?: string; customStart?: string; customEnd?: string } = {},
): PeriodRange {
  const thisMonth = { start: monthStart(today), end: monthEnd(today) };
  switch (period) {
    case "this_month":
      return thisMonth;
    case "last_3_months":
      return { start: monthStart(today, -2), end: monthEnd(today) };
    case "last_6_months":
      return { start: monthStart(today, -5), end: monthEnd(today) };
    case "last_12_months":
      return { start: monthStart(today, -11), end: monthEnd(today) };
    case "all_time":
      return {
        start: isIsoDate(opts.earliest) ? opts.earliest : thisMonth.start,
        end: monthEnd(today),
      };
    case "custom":
      if (
        isIsoDate(opts.customStart) &&
        isIsoDate(opts.customEnd) &&
        opts.customStart <= opts.customEnd
      ) {
        return { start: opts.customStart, end: opts.customEnd };
      }
      return thisMonth;
  }
}

/** Sum expenses whose date falls inside the inclusive range. */
export function expenseTotalInRange(
  expenses: { amount: number; expense_date: string }[],
  range: PeriodRange,
): number {
  let total = 0;
  for (const e of expenses) {
    if (e.expense_date >= range.start && e.expense_date <= range.end) {
      total += e.amount;
    }
  }
  return total;
}

export type BalanceStatus = "over" | "under" | "breakeven";

/**
 * Compare income to expenses for a period. `over` = income exceeds expenses
 * (surplus), `under` = expenses exceed income (shortfall), `breakeven` = equal
 * within a cent (to absorb floating-point noise).
 */
export function balance(
  income: number,
  expense: number,
): { net: number; status: BalanceStatus } {
  const net = income - expense;
  const status: BalanceStatus =
    Math.abs(net) < 0.01 ? "breakeven" : net > 0 ? "over" : "under";
  return { net: status === "breakeven" ? 0 : net, status };
}
