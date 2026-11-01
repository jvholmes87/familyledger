import { describe, it, expect } from "vitest";
import { incomeInRange, type IncomeSeriesRecord } from "./summary";

const monthly = (
  over: Partial<IncomeSeriesRecord> = {},
): IncomeSeriesRecord => ({
  amount: 1000,
  frequency: "every_n_months",
  interval: 1,
  days_of_month: [],
  start_date: "2026-01-01",
  end_date: null,
  category_name: "Wages",
  ...over,
});

describe("incomeInRange", () => {
  it("sums a monthly series across the whole range", () => {
    const result = incomeInRange([monthly()], "2026-01-01", "2026-03-31");
    expect(result.total).toBe(3000); // Jan, Feb, Mar
  });

  it("counts real biweekly occurrences, including 3-paycheck months", () => {
    const result = incomeInRange(
      [
        monthly({
          amount: 500,
          frequency: "every_n_weeks",
          interval: 2,
          start_date: "2026-01-02",
        }),
      ],
      "2026-01-01",
      "2026-01-31",
    );
    expect(result.total).toBe(1500); // Jan 2, 16, 30
  });

  it("groups totals by category, descending, with nulls as Uncategorized", () => {
    const result = incomeInRange(
      [
        monthly({ amount: 1000, category_name: "Wages" }),
        monthly({ amount: 3000, category_name: "VA Disability" }),
        monthly({ amount: 250, category_name: null }),
      ],
      "2026-01-01",
      "2026-01-31",
    );
    expect(result.total).toBe(4250);
    expect(result.byCategory).toEqual([
      { name: "VA Disability", total: 3000 },
      { name: "Wages", total: 1000 },
      { name: "Uncategorized", total: 250 },
    ]);
  });

  it("respects a series that ends mid-range", () => {
    const result = incomeInRange(
      [monthly({ end_date: "2026-02-15" })],
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.total).toBe(2000); // Jan + Feb only
  });

  it("returns an empty summary when nothing occurs", () => {
    const result = incomeInRange(
      [monthly({ start_date: "2027-01-01" })],
      "2026-01-01",
      "2026-12-31",
    );
    expect(result).toEqual({ total: 0, byCategory: [] });
  });
});
