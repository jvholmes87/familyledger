import { occurrencesInRange, type IncomeSchedule } from "./occurrences";

/** A stored income series enriched with its category name for grouping. */
export type IncomeSeriesRecord = IncomeSchedule & {
  amount: number;
  category_name: string | null;
};

export type IncomeSummary = {
  total: number;
  byCategory: { name: string; total: number }[];
};

/**
 * Total income received in [rangeStart, rangeEnd], summed from each series'
 * real calendar occurrences (so a biweekly series contributes 2 or 3 paychecks
 * depending on the month), grouped by category descending. Pure and
 * framework-free for unit testing and reuse by the income page and dashboard.
 */
export function incomeInRange(
  series: IncomeSeriesRecord[],
  rangeStart: string,
  rangeEnd: string,
): IncomeSummary {
  let total = 0;
  const categoryTotals = new Map<string, number>();

  for (const s of series) {
    const count = occurrencesInRange(s, rangeStart, rangeEnd).length;
    if (count === 0) continue;
    const amount = s.amount * count;
    total += amount;
    const name = s.category_name ?? "Uncategorized";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + amount);
  }

  const byCategory = [...categoryTotals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  return { total, byCategory };
}
