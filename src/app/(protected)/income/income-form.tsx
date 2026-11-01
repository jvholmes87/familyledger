"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  createIncomeSeries,
  updateIncomeSeries,
  type IncomeState,
} from "./actions";
import {
  FREQUENCY_PRESETS,
  LAST_DAY,
  presetForSchedule,
  resolvePreset,
  describeSchedule,
  ordinalDay,
  type PresetId,
} from "@/lib/income/frequency";
import { nextOccurrences, type FrequencyKind } from "@/lib/income/occurrences";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type IncomeCategory = { id: string; name: string };

export type IncomeSeriesFormValue = {
  id: string;
  name: string;
  amount: number;
  category_id: string | null;
  frequency: FrequencyKind;
  interval_count: number;
  days_of_month: number[];
  start_date: string;
  end_date: string | null;
};

// Day options for the days-of-month picker: 1..31 plus the "Last" sentinel.
const DAY_OPTIONS = [...Array.from({ length: 31 }, (_, i) => i + 1), LAST_DAY];

function sortDays(days: number[]): number[] {
  return [...days].sort((a, b) => (a === 0 ? 1 : b === 0 ? -1 : a - b));
}

function formatPreviewDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function IncomeForm({
  categories,
  series,
  today = new Date().toISOString().slice(0, 10),
}: {
  categories: IncomeCategory[];
  series?: IncomeSeriesFormValue;
  today?: string;
}) {
  const isEdit = Boolean(series);
  const initial = series
    ? presetForSchedule({
        frequency: series.frequency,
        interval: series.interval_count,
        days_of_month: series.days_of_month,
      })
    : { presetId: "every_month" as PresetId, interval: 1, daysOfMonth: [] };

  const [presetId, setPresetId] = useState<PresetId>(initial.presetId);
  const [interval, setIntervalValue] = useState(String(initial.interval));
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initial.daysOfMonth,
  );
  const [startDate, setStartDate] = useState(series?.start_date ?? "");
  const [endDate, setEndDate] = useState(series?.end_date ?? "");

  const [state, formAction, pending] = useActionState<IncomeState, FormData>(
    isEdit ? updateIncomeSeries : createIncomeSeries,
    undefined,
  );

  const preset = FREQUENCY_PRESETS.find((p) => p.id === presetId)!;

  function toggleDay(day: number) {
    setSelectedDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      let next = [...prev, day];
      // Twice a month is exactly two days: drop the oldest past two.
      if (presetId === "twice_a_month" && next.length > 2) {
        next = next.slice(next.length - 2);
      }
      return sortDays(next);
    });
  }

  // Live "next occurrences" preview, mirroring Simplifi's editor.
  const preview = useMemo(() => {
    if (!startDate) return null;
    const schedule = resolvePreset(presetId, {
      interval: Number(interval) || 1,
      daysOfMonth: selectedDays,
    });
    const full = {
      ...schedule,
      start_date: startDate,
      end_date: endDate || null,
    };
    return {
      summary: describeSchedule(full),
      dates: nextOccurrences(full, today, 6),
    };
  }, [presetId, interval, selectedDays, startDate, endDate, today]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {series ? <input type="hidden" name="id" value={series.id} /> : null}

      <fieldset className="flex flex-col gap-4">
        <legend className="sr-only">Income details</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. VA Disability"
              defaultValue={series?.name ?? ""}
              maxLength={120}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={series ? String(series.amount) : ""}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category_id">Category</Label>
            <Select
              id="category_id"
              name="category_id"
              defaultValue={series?.category_id ?? ""}
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              id="frequency"
              name="frequency"
              value={presetId}
              onChange={(e) => setPresetId(e.target.value as PresetId)}
            >
              {FREQUENCY_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {preset.shape === "interval" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="interval">Every how many {preset.unit}?</Label>
            <Input
              id="interval"
              name="interval"
              type="number"
              min="1"
              step="1"
              className="max-w-32"
              value={interval}
              onChange={(e) => setIntervalValue(e.target.value)}
            />
          </div>
        ) : null}

        {preset.shape === "days" ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">
              {presetId === "twice_a_month"
                ? "Select two days of the month"
                : "Select the days of the month"}
            </legend>
            <input
              type="hidden"
              name="days_of_month"
              value={selectedDays.join(",")}
            />
            <div className="flex flex-wrap gap-1.5">
              {DAY_OPTIONS.map((day) => {
                const pressed = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "focus-visible:ring-ring inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 font-mono text-xs tabular-nums transition-colors outline-none focus-visible:ring-2",
                      pressed
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-paper-raised text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {day === LAST_DAY ? "Last" : ordinalDay(day)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="start_date">Start date</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="end_date">End date (optional)</Label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {preview ? (
        <section
          aria-label="Schedule preview"
          className="border-border bg-paper-deep/40 rounded-xl border p-4"
        >
          <p className="text-sm font-semibold">{preview.summary}</p>
          {preview.dates.length > 0 ? (
            <>
              <p className="text-muted-foreground font-data mt-3 text-[0.625rem] font-semibold tracking-[0.12em] uppercase">
                Next {preview.dates.length}{" "}
                {preview.dates.length === 1 ? "payment" : "payments"}
              </p>
              <ul className="divide-border mt-1.5 divide-y">
                {preview.dates.map((date) => (
                  <li
                    key={date}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="tabular-nums">
                      {formatPreviewDate(date)}
                    </span>
                    <span aria-hidden="true" className="text-positive">
                      +
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-muted-foreground mt-2 text-xs">
              No upcoming payments in this window.
            </p>
          )}
        </section>
      ) : null}

      {state?.error ? (
        <p
          role="alert"
          className="border-negative/20 bg-negative/6 text-negative rounded-lg border px-3.5 py-3 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="min-h-11">
          {isEdit ? "Save changes" : "Add income"}
        </Button>
        {isEdit ? (
          <Link
            href="/income"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "min-h-11",
            })}
          >
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}
