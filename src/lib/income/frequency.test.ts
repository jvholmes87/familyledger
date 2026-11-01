import { describe, it, expect } from "vitest";
import {
  FREQUENCY_PRESETS,
  resolvePreset,
  presetForSchedule,
  describeSchedule,
  ordinalDay,
} from "./frequency";

describe("resolvePreset", () => {
  it("maps simple presets to engine kinds", () => {
    expect(resolvePreset("every_week", {})).toEqual({
      frequency: "every_n_weeks",
      interval: 1,
      days_of_month: [],
    });
    expect(resolvePreset("every_month", {})).toEqual({
      frequency: "every_n_months",
      interval: 1,
      days_of_month: [],
    });
    expect(resolvePreset("every_year", {})).toEqual({
      frequency: "every_n_years",
      interval: 1,
      days_of_month: [],
    });
    expect(resolvePreset("every_quarter", {})).toEqual({
      frequency: "every_n_months",
      interval: 3,
      days_of_month: [],
    });
    expect(resolvePreset("one_time", {})).toEqual({
      frequency: "one_time",
      interval: 1,
      days_of_month: [],
    });
  });

  it("carries the interval through the every-X presets", () => {
    expect(resolvePreset("every_x_days", { interval: 10 })).toEqual({
      frequency: "every_n_days",
      interval: 10,
      days_of_month: [],
    });
    expect(resolvePreset("every_x_weeks", { interval: 2 })).toEqual({
      frequency: "every_n_weeks",
      interval: 2,
      days_of_month: [],
    });
  });

  it("passes selected days through for twice-a-month and multiple fixed dates", () => {
    expect(resolvePreset("twice_a_month", { daysOfMonth: [15, 0] })).toEqual({
      frequency: "days_of_month",
      interval: 1,
      days_of_month: [15, 0],
    });
    expect(
      resolvePreset("multiple_fixed_dates", { daysOfMonth: [1, 10, 20] }),
    ).toEqual({
      frequency: "days_of_month",
      interval: 1,
      days_of_month: [1, 10, 20],
    });
  });
});

describe("presetForSchedule (round-trip for editing)", () => {
  const base = {
    days_of_month: [] as number[],
    start_date: "2026-01-15",
    end_date: null,
  };

  it("canonicalizes every_n_months interval 1 to 'every_month'", () => {
    expect(
      presetForSchedule({ ...base, frequency: "every_n_months", interval: 1 }),
    ).toMatchObject({ presetId: "every_month" });
  });

  it("canonicalizes every_n_months interval 3 to 'every_quarter'", () => {
    expect(
      presetForSchedule({ ...base, frequency: "every_n_months", interval: 3 }),
    ).toMatchObject({ presetId: "every_quarter" });
  });

  it("keeps every_n_months with other intervals as 'every_x_months'", () => {
    expect(
      presetForSchedule({ ...base, frequency: "every_n_months", interval: 5 }),
    ).toMatchObject({ presetId: "every_x_months", interval: 5 });
  });

  it("treats a two-day days_of_month as twice-a-month, more as multiple", () => {
    expect(
      presetForSchedule({
        ...base,
        frequency: "days_of_month",
        interval: 1,
        days_of_month: [15, 0],
      }),
    ).toMatchObject({ presetId: "twice_a_month", daysOfMonth: [15, 0] });
    expect(
      presetForSchedule({
        ...base,
        frequency: "days_of_month",
        interval: 1,
        days_of_month: [1, 10, 20],
      }),
    ).toMatchObject({ presetId: "multiple_fixed_dates" });
  });
});

describe("describeSchedule", () => {
  const base = {
    interval: 1,
    days_of_month: [] as number[],
    start_date: "2026-07-15",
    end_date: null,
  };

  it("describes a one-time payment", () => {
    expect(describeSchedule({ ...base, frequency: "one_time" })).toBe(
      "One-time payment.",
    );
  });

  it("describes weekly and biweekly", () => {
    expect(
      describeSchedule({ ...base, frequency: "every_n_weeks", interval: 1 }),
    ).toBe("Repeats every week.");
    expect(
      describeSchedule({ ...base, frequency: "every_n_weeks", interval: 2 }),
    ).toBe("Repeats every 2 weeks.");
  });

  it("describes a monthly series on its anchor day", () => {
    expect(
      describeSchedule({
        ...base,
        frequency: "every_n_months",
        interval: 1,
        start_date: "2026-07-15",
      }),
    ).toBe("Repeats every month on the 15th.");
  });

  it("describes twice a month like Simplifi", () => {
    expect(
      describeSchedule({
        ...base,
        frequency: "days_of_month",
        days_of_month: [15, 0],
      }),
    ).toBe("Repeats every month on the 15th and last.");
  });

  it("lists three fixed dates", () => {
    expect(
      describeSchedule({
        ...base,
        frequency: "days_of_month",
        days_of_month: [1, 10, 20],
      }),
    ).toBe("Repeats every month on the 1st, 10th, and 20th.");
  });
});

describe("ordinalDay", () => {
  it("formats ordinals and the 'last' sentinel", () => {
    expect(ordinalDay(1)).toBe("1st");
    expect(ordinalDay(2)).toBe("2nd");
    expect(ordinalDay(3)).toBe("3rd");
    expect(ordinalDay(11)).toBe("11th");
    expect(ordinalDay(21)).toBe("21st");
    expect(ordinalDay(0)).toBe("last");
  });
});

describe("FREQUENCY_PRESETS", () => {
  it("exposes all eleven Simplifi options", () => {
    expect(FREQUENCY_PRESETS).toHaveLength(11);
    expect(FREQUENCY_PRESETS.map((p) => p.id)).toContain("twice_a_month");
  });
});
