import { describe, it, expect } from "vitest";
import {
  resolvePeriod,
  expenseTotalInRange,
  balance,
  PERIOD_OPTIONS,
} from "./period";

describe("resolvePeriod", () => {
  const today = "2026-07-15";

  it("this month spans the full calendar month", () => {
    expect(resolvePeriod("this_month", today)).toEqual({
      start: "2026-07-01",
      end: "2026-07-31",
    });
  });

  it("last 3 / 6 / 12 months end at the current month end", () => {
    expect(resolvePeriod("last_3_months", today)).toEqual({
      start: "2026-05-01",
      end: "2026-07-31",
    });
    expect(resolvePeriod("last_6_months", today)).toEqual({
      start: "2026-02-01",
      end: "2026-07-31",
    });
    expect(resolvePeriod("last_12_months", today)).toEqual({
      start: "2025-08-01",
      end: "2026-07-31",
    });
  });

  it("all time starts at the earliest activity", () => {
    expect(
      resolvePeriod("all_time", today, { earliest: "2024-03-10" }),
    ).toEqual({ start: "2024-03-10", end: "2026-07-31" });
  });

  it("all time falls back to the current month when there is no activity", () => {
    expect(resolvePeriod("all_time", today)).toEqual({
      start: "2026-07-01",
      end: "2026-07-31",
    });
  });

  it("custom uses the provided dates", () => {
    expect(
      resolvePeriod("custom", today, {
        customStart: "2026-01-05",
        customEnd: "2026-04-20",
      }),
    ).toEqual({ start: "2026-01-05", end: "2026-04-20" });
  });

  it("custom falls back to this month when a bound is missing or inverted", () => {
    expect(
      resolvePeriod("custom", today, { customStart: "2026-01-05" }),
    ).toEqual({ start: "2026-07-01", end: "2026-07-31" });
    expect(
      resolvePeriod("custom", today, {
        customStart: "2026-05-01",
        customEnd: "2026-01-01",
      }),
    ).toEqual({ start: "2026-07-01", end: "2026-07-31" });
  });
});

describe("expenseTotalInRange", () => {
  const expenses = [
    { amount: 100, expense_date: "2026-06-30" },
    { amount: 50, expense_date: "2026-07-01" },
    { amount: 25, expense_date: "2026-07-31" },
    { amount: 999, expense_date: "2026-08-01" },
  ];

  it("sums only expenses within the inclusive range", () => {
    expect(
      expenseTotalInRange(expenses, { start: "2026-07-01", end: "2026-07-31" }),
    ).toBe(75);
  });
});

describe("balance", () => {
  it("reports a surplus when income exceeds expenses", () => {
    expect(balance(5000, 3000)).toEqual({ net: 2000, status: "over" });
  });

  it("reports a shortfall when expenses exceed income", () => {
    expect(balance(3000, 5000)).toEqual({ net: -2000, status: "under" });
  });

  it("reports break-even when they match (within a cent)", () => {
    expect(balance(3000, 3000)).toEqual({ net: 0, status: "breakeven" });
    expect(balance(3000, 3000.004)).toMatchObject({ status: "breakeven" });
  });
});

describe("PERIOD_OPTIONS", () => {
  it("offers presets plus custom", () => {
    expect(PERIOD_OPTIONS.map((p) => p.id)).toEqual([
      "this_month",
      "last_3_months",
      "last_6_months",
      "last_12_months",
      "all_time",
      "custom",
    ]);
  });
});
