import { describe, it, expect } from "vitest";
import { formatLedgerMonth, summarize, type ExpenseRecord } from "./summary";

const rows: ExpenseRecord[] = [
  { amount: 10, expense_date: "2026-07-02", category_name: "Groceries" },
  { amount: 5, expense_date: "2026-07-20", category_name: "Groceries" },
  { amount: 30, expense_date: "2026-07-15", category_name: "Rent" },
  { amount: 7, expense_date: "2026-07-18", category_name: null },
  { amount: 100, expense_date: "2026-06-10", category_name: "Rent" },
  { amount: 40, expense_date: "2026-05-01", category_name: "Groceries" },
];

describe("summarize", () => {
  it("totals only the current month", () => {
    const s = summarize(rows, "2026-07-09");
    expect(s.monthTotal).toBe(52); // 10 + 5 + 30 + 7
  });

  it("totals the previous month and computes the month-over-month delta", () => {
    const s = summarize(rows, "2026-07-09");
    expect(s.previousMonthTotal).toBe(100);
    expect(s.monthOverMonthDelta).toBe(-48); // 52 - 100
  });

  it("breaks the current month down by category, largest first", () => {
    const s = summarize(rows, "2026-07-09");
    expect(s.byCategory).toEqual([
      { name: "Rent", total: 30 },
      { name: "Groceries", total: 15 },
      { name: "Uncategorized", total: 7 },
    ]);
  });

  it("returns a monthly trend ending at the current month, oldest first", () => {
    const s = summarize(rows, "2026-07-09", 3);
    expect(s.trend).toEqual([
      { month: "2026-05", total: 40 },
      { month: "2026-06", total: 100 },
      { month: "2026-07", total: 52 },
    ]);
  });

  it("fills empty months in the trend with zero", () => {
    const s = summarize(
      [{ amount: 12, expense_date: "2026-07-01", category_name: null }],
      "2026-07-09",
      3,
    );
    expect(s.trend).toEqual([
      { month: "2026-05", total: 0 },
      { month: "2026-06", total: 0 },
      { month: "2026-07", total: 12 },
    ]);
  });

  it("handles a year boundary when finding the previous month", () => {
    const s = summarize(
      [{ amount: 8, expense_date: "2025-12-31", category_name: "Rent" }],
      "2026-01-05",
    );
    expect(s.previousMonthTotal).toBe(8);
    expect(s.monthTotal).toBe(0);
  });

  it("returns zeros and empty lists when there are no expenses", () => {
    const s = summarize([], "2026-07-09", 3);
    expect(s.monthTotal).toBe(0);
    expect(s.previousMonthTotal).toBe(0);
    expect(s.monthOverMonthDelta).toBe(0);
    expect(s.byCategory).toEqual([]);
    expect(s.trend).toEqual([
      { month: "2026-05", total: 0 },
      { month: "2026-06", total: 0 },
      { month: "2026-07", total: 0 },
    ]);
  });
});

describe("formatLedgerMonth", () => {
  it("keeps the label in the same UTC calendar month as the summary key", () => {
    expect(formatLedgerMonth("2026-08-01")).toBe("August 2026");
  });
});
