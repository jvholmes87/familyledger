export type ExpenseRecord = {
  amount: number;
  /** ISO calendar date, yyyy-mm-dd. */
  expense_date: string;
  category_name: string | null;
};

export type DashboardSummary = {
  monthTotal: number;
  previousMonthTotal: number;
  monthOverMonthDelta: number;
  byCategory: { name: string; total: number }[];
  trend: { month: string; total: number }[];
};

/** Shift a "yyyy-mm" month string by a number of months. */
function addMonths(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  const zeroBased = year * 12 + (mon - 1) + delta;
  const y = Math.floor(zeroBased / 12);
  const m = (zeroBased % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

const monthOf = (isoDate: string): string => isoDate.slice(0, 7);

/** Format a yyyy-mm-dd summary key without allowing local timezone drift. */
export function formatLedgerMonth(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${monthOf(isoDate)}-01T00:00:00Z`));
}

/**
 * Compute the dashboard spending summary from a user's expense records.
 * Pure and framework-free: `today` (yyyy-mm-dd) and the trend length are
 * passed in so the result is deterministic and unit-testable. Comparisons are
 * done on the yyyy-mm month prefix to avoid timezone drift.
 */
export function summarize(
  expenses: ExpenseRecord[],
  today: string,
  trendMonths = 6,
): DashboardSummary {
  const currentMonth = monthOf(today);
  const previousMonth = addMonths(currentMonth, -1);

  let monthTotal = 0;
  let previousMonthTotal = 0;
  const categoryTotals = new Map<string, number>();
  const monthlyTotals = new Map<string, number>();

  for (const e of expenses) {
    const month = monthOf(e.expense_date);
    monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + e.amount);

    if (month === currentMonth) {
      monthTotal += e.amount;
      const name = e.category_name ?? "Uncategorized";
      categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + e.amount);
    } else if (month === previousMonth) {
      previousMonthTotal += e.amount;
    }
  }

  const byCategory = [...categoryTotals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const trend: { month: string; total: number }[] = [];
  for (let i = trendMonths - 1; i >= 0; i--) {
    const month = addMonths(currentMonth, -i);
    trend.push({ month, total: monthlyTotals.get(month) ?? 0 });
  }

  return {
    monthTotal,
    previousMonthTotal,
    monthOverMonthDelta: monthTotal - previousMonthTotal,
    byCategory,
    trend,
  };
}
