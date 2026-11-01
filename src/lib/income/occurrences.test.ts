import { describe, it, expect } from "vitest";
import {
  occurrencesInRange,
  nextOccurrences,
  type IncomeSchedule,
} from "./occurrences";

const base: IncomeSchedule = {
  frequency: "one_time",
  interval: 1,
  days_of_month: [],
  start_date: "2026-01-01",
  end_date: null,
};

describe("occurrencesInRange", () => {
  it("one-time: emits the start date when it lands in range", () => {
    expect(
      occurrencesInRange(
        { ...base, frequency: "one_time", start_date: "2026-05-10" },
        "2026-01-01",
        "2026-12-31",
      ),
    ).toEqual(["2026-05-10"]);
  });

  it("one-time: emits nothing when the start date is outside the range", () => {
    expect(
      occurrencesInRange(
        { ...base, frequency: "one_time", start_date: "2026-05-10" },
        "2026-06-01",
        "2026-12-31",
      ),
    ).toEqual([]);
  });

  it("every N days: steps by the interval and stops at the range end", () => {
    expect(
      occurrencesInRange(
        {
          ...base,
          frequency: "every_n_days",
          interval: 10,
          start_date: "2026-01-01",
        },
        "2026-01-01",
        "2026-02-01",
      ),
    ).toEqual(["2026-01-01", "2026-01-11", "2026-01-21", "2026-01-31"]);
  });

  it("weekly (every 1 week): lands on the same weekday", () => {
    expect(
      occurrencesInRange(
        {
          ...base,
          frequency: "every_n_weeks",
          interval: 1,
          start_date: "2026-03-06",
        },
        "2026-03-01",
        "2026-03-31",
      ),
    ).toEqual(["2026-03-06", "2026-03-13", "2026-03-20", "2026-03-27"]);
  });

  it("biweekly: yields three paychecks in a month when the calendar allows", () => {
    expect(
      occurrencesInRange(
        {
          ...base,
          frequency: "every_n_weeks",
          interval: 2,
          start_date: "2026-01-02",
        },
        "2026-01-01",
        "2026-01-31",
      ),
    ).toEqual(["2026-01-02", "2026-01-16", "2026-01-30"]);
  });

  it("biweekly: skips ahead efficiently to the range start", () => {
    expect(
      occurrencesInRange(
        {
          ...base,
          frequency: "every_n_weeks",
          interval: 2,
          start_date: "2026-01-02",
        },
        "2026-02-01",
        "2026-02-28",
      ),
    ).toEqual(["2026-02-13", "2026-02-27"]);
  });

  it("monthly: clamps to the last day for short months", () => {
    expect(
      occurrencesInRange(
        {
          ...base,
          frequency: "every_n_months",
          interval: 1,
          start_date: "2026-01-31",
        },
        "2026-01-01",
        "2026-04-30",
      ),
    ).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
  });

  it("quarterly (every 3 months): steps a season at a time", () => {
    expect(
      occurrencesInRange(
        {
          ...base,
          frequency: "every_n_months",
          interval: 3,
          start_date: "2026-01-15",
        },
        "2026-01-01",
        "2026-12-31",
      ),
    ).toEqual(["2026-01-15", "2026-04-15", "2026-07-15", "2026-10-15"]);
  });

  it("annually: clamps a Feb 29 anchor to Feb 28 in non-leap years", () => {
    expect(
      occurrencesInRange(
        {
          ...base,
          frequency: "every_n_years",
          interval: 1,
          start_date: "2024-02-29",
        },
        "2024-01-01",
        "2028-12-31",
      ),
    ).toEqual([
      "2024-02-29",
      "2025-02-28",
      "2026-02-28",
      "2027-02-28",
      "2028-02-29",
    ]);
  });

  it("twice a month (15th & Last): matches the Simplifi preview", () => {
    expect(
      occurrencesInRange(
        {
          ...base,
          frequency: "days_of_month",
          days_of_month: [15, 0], // 0 sentinel = last day of month
          start_date: "2026-07-15",
        },
        "2026-07-01",
        "2026-09-30",
      ),
    ).toEqual([
      "2026-07-15",
      "2026-07-31",
      "2026-08-15",
      "2026-08-31",
      "2026-09-15",
      "2026-09-30",
    ]);
  });

  it("days of month: dedupes when a fixed day coincides with 'Last'", () => {
    expect(
      occurrencesInRange(
        {
          ...base,
          frequency: "days_of_month",
          days_of_month: [30, 0],
          start_date: "2026-06-01",
        },
        "2026-06-01",
        "2026-06-30",
      ),
    ).toEqual(["2026-06-30"]);
  });

  it("respects the series start date within a range", () => {
    expect(
      occurrencesInRange(
        {
          ...base,
          frequency: "every_n_months",
          interval: 1,
          start_date: "2026-03-10",
        },
        "2026-01-01",
        "2026-05-31",
      ),
    ).toEqual(["2026-03-10", "2026-04-10", "2026-05-10"]);
  });

  it("respects the series end date (inclusive)", () => {
    expect(
      occurrencesInRange(
        {
          ...base,
          frequency: "every_n_months",
          interval: 1,
          start_date: "2026-01-10",
          end_date: "2026-03-10",
        },
        "2026-01-01",
        "2026-12-31",
      ),
    ).toEqual(["2026-01-10", "2026-02-10", "2026-03-10"]);
  });

  it("returns nothing when the range is inverted", () => {
    expect(
      occurrencesInRange(
        { ...base, frequency: "every_n_days", interval: 1 },
        "2026-05-01",
        "2026-04-01",
      ),
    ).toEqual([]);
  });

  it("treats an interval below 1 as 1", () => {
    expect(
      occurrencesInRange(
        {
          ...base,
          frequency: "every_n_months",
          interval: 0,
          start_date: "2026-01-01",
        },
        "2026-01-01",
        "2026-03-31",
      ),
    ).toEqual(["2026-01-01", "2026-02-01", "2026-03-01"]);
  });
});

describe("nextOccurrences", () => {
  it("returns the next N dates from a reference day (twice a month)", () => {
    expect(
      nextOccurrences(
        {
          ...base,
          frequency: "days_of_month",
          days_of_month: [15, 0],
          start_date: "2026-07-15",
        },
        "2026-07-01",
        6,
      ),
    ).toEqual([
      "2026-07-15",
      "2026-07-31",
      "2026-08-15",
      "2026-08-31",
      "2026-09-15",
      "2026-09-30",
    ]);
  });

  it("returns fewer than N when a one-time series has no more occurrences", () => {
    expect(
      nextOccurrences(
        { ...base, frequency: "one_time", start_date: "2026-07-15" },
        "2026-07-01",
        6,
      ),
    ).toEqual(["2026-07-15"]);
  });

  it("handles far-apart annual occurrences", () => {
    expect(
      nextOccurrences(
        {
          ...base,
          frequency: "every_n_years",
          interval: 1,
          start_date: "2026-03-01",
        },
        "2026-01-01",
        3,
      ),
    ).toEqual(["2026-03-01", "2027-03-01", "2028-03-01"]);
  });
});
