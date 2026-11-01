import { describe, it, expect } from "vitest";
import { parseIncomeSeries, type IncomeSeriesInput } from "./validation";

const valid: IncomeSeriesInput = {
  name: "VA Disability",
  amount: "3737.85",
  category_id: "cat-1",
  frequency: "every_month",
  interval: "1",
  days_of_month: "",
  start_date: "2026-01-01",
  end_date: "",
};

function ok(input: IncomeSeriesInput) {
  const result = parseIncomeSeries(input);
  if (!result.success) throw new Error(`expected success: ${result.error}`);
  return result.data;
}

describe("parseIncomeSeries", () => {
  it("accepts a monthly series and maps it to the engine shape", () => {
    expect(ok(valid)).toEqual({
      name: "VA Disability",
      amount: 3737.85,
      category_id: "cat-1",
      frequency: "every_n_months",
      interval_count: 1,
      days_of_month: [],
      start_date: "2026-01-01",
      end_date: null,
    });
  });

  it("requires a name", () => {
    expect(parseIncomeSeries({ ...valid, name: "  " })).toEqual({
      success: false,
      error: "Name is required.",
    });
  });

  it("rejects a name over 120 characters", () => {
    expect(parseIncomeSeries({ ...valid, name: "x".repeat(121) }).success).toBe(
      false,
    );
  });

  it("requires a valid, non-negative amount", () => {
    expect(parseIncomeSeries({ ...valid, amount: "" })).toMatchObject({
      success: false,
      error: "Amount is required.",
    });
    expect(parseIncomeSeries({ ...valid, amount: "abc" })).toMatchObject({
      success: false,
      error: "Enter a valid amount.",
    });
    expect(parseIncomeSeries({ ...valid, amount: "-5" })).toMatchObject({
      success: false,
      error: "Amount must be zero or greater.",
    });
  });

  it("requires a valid start date", () => {
    expect(parseIncomeSeries({ ...valid, start_date: "" })).toMatchObject({
      success: false,
      error: "Start date is required.",
    });
    expect(parseIncomeSeries({ ...valid, start_date: "nope" })).toMatchObject({
      success: false,
      error: "Enter a valid start date.",
    });
  });

  it("treats an empty end date as null (open-ended)", () => {
    expect(ok({ ...valid, end_date: "" }).end_date).toBeNull();
  });

  it("rejects an end date before the start date", () => {
    expect(
      parseIncomeSeries({
        ...valid,
        start_date: "2026-06-01",
        end_date: "2026-05-01",
      }),
    ).toMatchObject({
      success: false,
      error: "End date must be on or after the start date.",
    });
  });

  it("treats an empty category as null", () => {
    expect(ok({ ...valid, category_id: "" }).category_id).toBeNull();
  });

  it("rejects an unknown frequency preset", () => {
    expect(parseIncomeSeries({ ...valid, frequency: "bogus" })).toMatchObject({
      success: false,
      error: "Choose a frequency.",
    });
  });

  it("carries the interval for every-X presets and requires it to be >= 1", () => {
    expect(
      ok({ ...valid, frequency: "every_x_weeks", interval: "2" }),
    ).toMatchObject({ frequency: "every_n_weeks", interval_count: 2 });
    expect(
      parseIncomeSeries({
        ...valid,
        frequency: "every_x_weeks",
        interval: "0",
      }),
    ).toMatchObject({ success: false, error: "Interval must be at least 1." });
  });

  it("maps 'every quarter' to a 3-month interval", () => {
    expect(ok({ ...valid, frequency: "every_quarter" })).toMatchObject({
      frequency: "every_n_months",
      interval_count: 3,
    });
  });

  it("normalizes twice-a-month days with 'Last' sorted to the end", () => {
    expect(
      ok({
        ...valid,
        frequency: "twice_a_month",
        days_of_month: "0,15",
      }),
    ).toMatchObject({ frequency: "days_of_month", days_of_month: [15, 0] });
  });

  it("requires exactly two days for twice-a-month", () => {
    expect(
      parseIncomeSeries({
        ...valid,
        frequency: "twice_a_month",
        days_of_month: "15",
      }),
    ).toMatchObject({
      success: false,
      error: "Pick two days of the month.",
    });
  });

  it("requires at least one day for multiple fixed dates and dedupes", () => {
    expect(
      parseIncomeSeries({
        ...valid,
        frequency: "multiple_fixed_dates",
        days_of_month: "",
      }),
    ).toMatchObject({
      success: false,
      error: "Pick at least one day of the month.",
    });
    expect(
      ok({
        ...valid,
        frequency: "multiple_fixed_dates",
        days_of_month: "10,10,1,20",
      }),
    ).toMatchObject({ days_of_month: [1, 10, 20] });
  });

  it("rejects an out-of-range day", () => {
    expect(
      parseIncomeSeries({
        ...valid,
        frequency: "multiple_fixed_dates",
        days_of_month: "32",
      }),
    ).toMatchObject({
      success: false,
      error: "Enter valid days of the month.",
    });
  });
});
