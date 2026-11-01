/**
 * Translation layer between the eleven Simplifi-style UI frequency presets and
 * the six {@link FrequencyKind} cadences the occurrence engine understands.
 *
 * The database stores the engine kind + interval + days_of_month (canonical,
 * six shapes). The form speaks in presets; {@link resolvePreset} maps a preset
 * to a schedule and {@link presetForSchedule} recovers a preset for editing.
 */
import type { FrequencyKind, IncomeSchedule } from "./occurrences";

/** Sentinel day value meaning "last day of the month". */
export const LAST_DAY = 0;

export type PresetId =
  | "one_time"
  | "every_week"
  | "every_month"
  | "every_year"
  | "twice_a_month"
  | "every_quarter"
  | "every_x_days"
  | "every_x_weeks"
  | "every_x_months"
  | "every_x_years"
  | "multiple_fixed_dates";

export type PresetShape = "simple" | "interval" | "days";

export type FrequencyPreset = {
  id: PresetId;
  label: string;
  /** Which extra inputs the form should show for this preset. */
  shape: PresetShape;
  /** Noun used in the "Every X ___" input (interval presets only). */
  unit?: "days" | "weeks" | "months" | "years";
};

export const FREQUENCY_PRESETS: FrequencyPreset[] = [
  { id: "one_time", label: "One-time payment", shape: "simple" },
  { id: "every_week", label: "Every week", shape: "simple" },
  { id: "every_month", label: "Every month", shape: "simple" },
  { id: "every_year", label: "Every year", shape: "simple" },
  { id: "twice_a_month", label: "Twice a month", shape: "days" },
  { id: "every_quarter", label: "Every quarter", shape: "simple" },
  {
    id: "every_x_days",
    label: "Every X days",
    shape: "interval",
    unit: "days",
  },
  {
    id: "every_x_weeks",
    label: "Every X weeks",
    shape: "interval",
    unit: "weeks",
  },
  {
    id: "every_x_months",
    label: "Every X months",
    shape: "interval",
    unit: "months",
  },
  {
    id: "every_x_years",
    label: "Every X years",
    shape: "interval",
    unit: "years",
  },
  { id: "multiple_fixed_dates", label: "Multiple fixed dates", shape: "days" },
];

type Schedule = Pick<
  IncomeSchedule,
  "frequency" | "interval" | "days_of_month"
>;

/** Resolve a UI preset (+ its interval/days inputs) into an engine schedule. */
export function resolvePreset(
  id: PresetId,
  opts: { interval?: number; daysOfMonth?: number[] },
): Schedule {
  const interval = Math.max(1, Math.trunc(opts.interval ?? 1));
  const days_of_month = opts.daysOfMonth ?? [];
  switch (id) {
    case "one_time":
      return { frequency: "one_time", interval: 1, days_of_month: [] };
    case "every_week":
      return { frequency: "every_n_weeks", interval: 1, days_of_month: [] };
    case "every_month":
      return { frequency: "every_n_months", interval: 1, days_of_month: [] };
    case "every_year":
      return { frequency: "every_n_years", interval: 1, days_of_month: [] };
    case "every_quarter":
      return { frequency: "every_n_months", interval: 3, days_of_month: [] };
    case "every_x_days":
      return { frequency: "every_n_days", interval, days_of_month: [] };
    case "every_x_weeks":
      return { frequency: "every_n_weeks", interval, days_of_month: [] };
    case "every_x_months":
      return { frequency: "every_n_months", interval, days_of_month: [] };
    case "every_x_years":
      return { frequency: "every_n_years", interval, days_of_month: [] };
    case "twice_a_month":
    case "multiple_fixed_dates":
      return { frequency: "days_of_month", interval: 1, days_of_month };
  }
}

/** Recover the preset (and its inputs) that produced a stored schedule. */
export function presetForSchedule(schedule: Schedule): {
  presetId: PresetId;
  interval: number;
  daysOfMonth: number[];
} {
  const { frequency, interval, days_of_month } = schedule;
  switch (frequency) {
    case "one_time":
      return { presetId: "one_time", interval: 1, daysOfMonth: [] };
    case "every_n_days":
      return { presetId: "every_x_days", interval, daysOfMonth: [] };
    case "every_n_weeks":
      return {
        presetId: interval === 1 ? "every_week" : "every_x_weeks",
        interval,
        daysOfMonth: [],
      };
    case "every_n_months":
      return {
        presetId:
          interval === 1
            ? "every_month"
            : interval === 3
              ? "every_quarter"
              : "every_x_months",
        interval,
        daysOfMonth: [],
      };
    case "every_n_years":
      return {
        presetId: interval === 1 ? "every_year" : "every_x_years",
        interval,
        daysOfMonth: [],
      };
    case "days_of_month":
      return {
        presetId:
          days_of_month.length <= 2 ? "twice_a_month" : "multiple_fixed_dates",
        interval: 1,
        daysOfMonth: days_of_month,
      };
  }
}

/** Format a day-of-month as an ordinal, or "last" for the 0 sentinel. */
export function ordinalDay(day: number): string {
  if (day === LAST_DAY) return "last";
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th";
  return `${day}${suffix}`;
}

/** Join labels into a comma list with an Oxford "and". */
function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** A human sentence describing when a schedule pays out (for the form/list). */
export function describeSchedule(
  schedule: Pick<
    IncomeSchedule,
    "frequency" | "interval" | "days_of_month" | "start_date"
  >,
): string {
  const { frequency, days_of_month, start_date } = schedule;
  const interval = Math.max(1, Math.trunc(schedule.interval));
  const every = (n: number, unit: string) =>
    n === 1 ? `every ${unit}` : `every ${n} ${unit}s`;

  switch (frequency) {
    case "one_time":
      return "One-time payment.";
    case "every_n_days":
      return `Repeats ${every(interval, "day")}.`;
    case "every_n_weeks":
      return `Repeats ${every(interval, "week")}.`;
    case "every_n_years":
      return `Repeats ${every(interval, "year")}.`;
    case "every_n_months": {
      const day = Number(start_date.slice(8, 10));
      const cadence =
        interval === 3 ? "every quarter" : every(interval, "month");
      return `Repeats ${cadence} on the ${ordinalDay(day)}.`;
    }
    case "days_of_month": {
      const days = joinList(days_of_month.map(ordinalDay));
      return `Repeats every month on the ${days}.`;
    }
  }
}

const kindLabels: Record<FrequencyKind, string> = {
  one_time: "One-time",
  every_n_days: "Every X days",
  every_n_weeks: "Weekly",
  every_n_months: "Monthly",
  every_n_years: "Annually",
  days_of_month: "Twice a month",
};

/** Short badge label for a schedule, shown in the income list. */
export function shortFrequencyLabel(schedule: Schedule): string {
  const preset = presetForSchedule(schedule);
  const found = FREQUENCY_PRESETS.find((p) => p.id === preset.presetId);
  return found?.label ?? kindLabels[schedule.frequency];
}
