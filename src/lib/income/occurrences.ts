/**
 * Recurring-income occurrence engine.
 *
 * A single {@link IncomeSchedule} describes both one-off and recurring income
 * (a one-off is simply a `one_time` schedule). {@link occurrencesInRange}
 * expands a schedule into the real calendar dates it lands on inside a window,
 * so dashboards and previews can sum "actual per-month" income rather than an
 * averaged multiplier.
 *
 * All date math is done on UTC midnight to stay free of local timezone drift,
 * mirroring the yyyy-mm approach used by the dashboard summary.
 */

/** The six engine cadences the eleven UI frequencies collapse onto. */
export type FrequencyKind =
  | "one_time"
  | "every_n_days"
  | "every_n_weeks"
  | "every_n_months"
  | "every_n_years"
  | "days_of_month";

export type IncomeSchedule = {
  frequency: FrequencyKind;
  /** The "X" in every-X-days/weeks/months/years. Values below 1 mean 1. */
  interval: number;
  /**
   * Days of the month to hit for the `days_of_month` cadence (twice-a-month /
   * multiple fixed dates). `0` is the sentinel for "Last day of month".
   */
  days_of_month: number[];
  /** ISO calendar date, yyyy-mm-dd. The cadence is anchored here. */
  start_date: string;
  /** Inclusive ISO end date, or null for an open-ended series. */
  end_date: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parse a yyyy-mm-dd string into a UTC-midnight epoch. */
function toUtc(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Format a UTC-midnight epoch back to yyyy-mm-dd. */
function toIso(utc: number): string {
  return new Date(utc).toISOString().slice(0, 10);
}

/** Number of days in a given (1-based) month. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Build a UTC epoch for a year/month/day, clamping the day to the month's
 * length (so a "31" anchor becomes the 30th/28th) and treating `0` as the
 * last day of the month.
 */
function clampedDate(year: number, month: number, day: number): number {
  const last = daysInMonth(year, month);
  const resolved = day === 0 ? last : Math.min(day, last);
  return Date.UTC(year, month - 1, resolved);
}

export function occurrencesInRange(
  schedule: IncomeSchedule,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  const windowStart = Math.max(toUtc(rangeStart), toUtc(schedule.start_date));
  const seriesEnd = schedule.end_date ? toUtc(schedule.end_date) : Infinity;
  const windowEnd = Math.min(toUtc(rangeEnd), seriesEnd);
  if (windowStart > windowEnd) return [];

  const start = toUtc(schedule.start_date);
  const interval = Math.max(1, Math.trunc(schedule.interval));
  const results: number[] = [];

  const emit = (utc: number) => {
    if (utc >= windowStart && utc <= windowEnd) results.push(utc);
  };

  switch (schedule.frequency) {
    case "one_time": {
      emit(start);
      break;
    }

    case "every_n_days":
    case "every_n_weeks": {
      const stepDays =
        interval * (schedule.frequency === "every_n_weeks" ? 7 : 1);
      const stepMs = stepDays * DAY_MS;
      // Jump straight to the first occurrence at or after the window start.
      const skipped = Math.max(0, Math.ceil((windowStart - start) / stepMs));
      for (let t = start + skipped * stepMs; t <= windowEnd; t += stepMs) {
        emit(t);
      }
      break;
    }

    case "every_n_months":
    case "every_n_years": {
      const stepMonths =
        interval * (schedule.frequency === "every_n_years" ? 12 : 1);
      const startYear = new Date(start).getUTCFullYear();
      const startMonth = new Date(start).getUTCMonth() + 1; // 1-based
      const anchorDay = new Date(start).getUTCDate();
      for (let i = 0; ; i++) {
        const monthIndex = startMonth - 1 + i * stepMonths;
        const year = startYear + Math.floor(monthIndex / 12);
        const month = (monthIndex % 12) + 1;
        const utc = clampedDate(year, month, anchorDay);
        if (utc > windowEnd) break;
        emit(utc);
      }
      break;
    }

    case "days_of_month": {
      const startYear = new Date(start).getUTCFullYear();
      const startMonth = new Date(start).getUTCMonth() + 1;
      for (let i = 0; ; i++) {
        const monthIndex = startMonth - 1 + i;
        const year = startYear + Math.floor(monthIndex / 12);
        const month = (monthIndex % 12) + 1;
        // Resolve, dedupe, and order this month's picked days.
        const days = [
          ...new Set(
            schedule.days_of_month.map((d) => clampedDate(year, month, d)),
          ),
        ].sort((a, b) => a - b);
        // Stop once the whole month is past the window end.
        if (Date.UTC(year, month - 1, 1) > windowEnd) break;
        for (const utc of days) emit(utc);
      }
      break;
    }
  }

  results.sort((a, b) => a - b);
  return results.map(toIso);
}

/** Add `count` months to a yyyy-mm-dd date, clamping the day to month length. */
function addMonthsIso(iso: string, count: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const monthIndex = y * 12 + (m - 1) + count;
  const year = Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  return toIso(clampedDate(year, month, d));
}

/**
 * The next `count` occurrences on or after `from`. Powers the form's live
 * "Preview next occurrences" panel. A generous, cadence-sized horizon keeps
 * generation cheap even for annual series, and the result is capped at `count`.
 */
export function nextOccurrences(
  schedule: IncomeSchedule,
  from: string,
  count: number,
): string[] {
  const interval = Math.max(1, Math.trunc(schedule.interval));
  let horizon: string;
  switch (schedule.frequency) {
    case "one_time":
      horizon = schedule.start_date;
      break;
    case "every_n_days":
      horizon = toIso(toUtc(from) + (count + 1) * interval * DAY_MS);
      break;
    case "every_n_weeks":
      horizon = toIso(toUtc(from) + (count + 1) * interval * 7 * DAY_MS);
      break;
    case "every_n_months":
      horizon = addMonthsIso(from, (count + 1) * interval);
      break;
    case "every_n_years":
      horizon = addMonthsIso(from, (count + 1) * interval * 12);
      break;
    case "days_of_month":
      horizon = addMonthsIso(from, count + 1);
      break;
  }
  const end = horizon >= from ? horizon : from;
  return occurrencesInRange(schedule, from, end).slice(0, count);
}
