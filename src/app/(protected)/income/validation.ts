import {
  FREQUENCY_PRESETS,
  resolvePreset,
  type PresetId,
} from "@/lib/income/frequency";
import type { FrequencyKind } from "@/lib/income/occurrences";

export type IncomeSeriesInput = {
  name: string;
  amount: string;
  category_id: string;
  /** One of the eleven UI frequency preset ids. */
  frequency: string;
  /** The "X" for every-X-days/weeks/months/years presets. */
  interval: string;
  /** Comma-separated days of month; "0" = last day. */
  days_of_month: string;
  start_date: string;
  end_date: string;
};

export type IncomeSeriesData = {
  name: string;
  amount: number;
  category_id: string | null;
  frequency: FrequencyKind;
  interval_count: number;
  days_of_month: number[];
  start_date: string;
  end_date: string | null;
};

export type IncomeSeriesParseResult =
  | { success: true; data: IncomeSeriesData }
  | { success: false; error: string };

const MAX_NAME_LENGTH = 120;

const presetIds = new Set<string>(FREQUENCY_PRESETS.map((p) => p.id));
const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

/** Parse a comma-separated day list; 0 = last, 1-31 = fixed. Deduped/sorted. */
function parseDays(raw: string): number[] | null {
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const days: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const day = Number(part);
    if (day < 0 || day > 31) return null;
    days.push(day);
  }
  const unique = [...new Set(days)];
  // Ascending, with the "last day" sentinel (0) sorted to the end.
  return unique.sort((a, b) => (a === 0 ? 1 : b === 0 ? -1 : a - b));
}

/**
 * Validate and normalize raw income-series form values, translating the UI
 * frequency preset into the engine schedule the database stores. Pure and
 * framework-free so the create/update actions and unit tests share it.
 */
export function parseIncomeSeries(
  input: IncomeSeriesInput,
): IncomeSeriesParseResult {
  const name = input.name.trim();
  if (!name) return { success: false, error: "Name is required." };
  if (name.length > MAX_NAME_LENGTH) {
    return {
      success: false,
      error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
    };
  }

  const amountRaw = input.amount.trim();
  if (!amountRaw) return { success: false, error: "Amount is required." };
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount)) {
    return { success: false, error: "Enter a valid amount." };
  }
  if (amount < 0) {
    return { success: false, error: "Amount must be zero or greater." };
  }

  const startRaw = input.start_date.trim();
  if (!startRaw) return { success: false, error: "Start date is required." };
  if (!isIsoDate(startRaw) || Number.isNaN(new Date(startRaw).getTime())) {
    return { success: false, error: "Enter a valid start date." };
  }

  const endRaw = input.end_date.trim();
  let end_date: string | null = null;
  if (endRaw) {
    if (!isIsoDate(endRaw) || Number.isNaN(new Date(endRaw).getTime())) {
      return { success: false, error: "Enter a valid end date." };
    }
    if (endRaw < startRaw) {
      return {
        success: false,
        error: "End date must be on or after the start date.",
      };
    }
    end_date = endRaw;
  }

  if (!presetIds.has(input.frequency)) {
    return { success: false, error: "Choose a frequency." };
  }
  const presetId = input.frequency as PresetId;
  const preset = FREQUENCY_PRESETS.find((p) => p.id === presetId)!;

  let interval = 1;
  if (preset.shape === "interval") {
    const parsed = Number(input.interval.trim());
    if (!Number.isInteger(parsed) || parsed < 1) {
      return { success: false, error: "Interval must be at least 1." };
    }
    interval = parsed;
  }

  let daysOfMonth: number[] = [];
  if (preset.shape === "days") {
    const parsed = parseDays(input.days_of_month);
    if (parsed === null) {
      return { success: false, error: "Enter valid days of the month." };
    }
    if (presetId === "twice_a_month" && parsed.length !== 2) {
      return { success: false, error: "Pick two days of the month." };
    }
    if (presetId === "multiple_fixed_dates" && parsed.length < 1) {
      return { success: false, error: "Pick at least one day of the month." };
    }
    daysOfMonth = parsed;
  }

  const schedule = resolvePreset(presetId, {
    interval,
    daysOfMonth,
  });

  return {
    success: true,
    data: {
      name,
      amount,
      category_id: input.category_id ? input.category_id : null,
      frequency: schedule.frequency,
      interval_count: schedule.interval,
      days_of_month: schedule.days_of_month,
      start_date: startRaw,
      end_date,
    },
  };
}
