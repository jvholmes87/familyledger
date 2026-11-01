"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { incomeInRange, type IncomeSeriesRecord } from "@/lib/income/summary";
import {
  PERIOD_OPTIONS,
  resolvePeriod,
  type PeriodId,
} from "@/lib/income/period";
import { IncomeDonut } from "./income-donut";

/**
 * Income-by-category donut with a period selector, mirroring the dashboard's
 * balance panel. Recomputes the mix in the browser from the full record set as
 * the period changes.
 */
export function IncomeMix({
  records,
  today,
  earliest,
}: {
  records: IncomeSeriesRecord[];
  today: string;
  earliest?: string;
}) {
  const [period, setPeriod] = useState<PeriodId>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const byCategory = useMemo(() => {
    const range = resolvePeriod(period, today, {
      earliest,
      customStart,
      customEnd,
    });
    return incomeInRange(records, range.start, range.end).byCategory;
  }, [period, customStart, customEnd, today, earliest, records]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          Share of income by source
        </p>
        <div>
          <Label htmlFor="income-mix-period" className="sr-only">
            Period
          </Label>
          <Select
            id="income-mix-period"
            aria-label="Income mix period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodId)}
            className="sm:w-48"
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {period === "custom" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="income-mix-from">From</Label>
            <input
              id="income-mix-from"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border-input bg-paper-raised h-11 rounded-lg border px-3.5 text-sm outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="income-mix-to">To</Label>
            <input
              id="income-mix-to"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border-input bg-paper-raised h-11 rounded-lg border px-3.5 text-sm outline-none"
            />
          </div>
        </div>
      ) : null}

      <IncomeDonut slices={byCategory} />
    </div>
  );
}
