"use client";

import { useState } from "react";
import { MoneyAmount } from "@/components/money-amount";
import { cn } from "@/lib/utils";

export type IncomeSlice = { name: string; total: number };

// Cycle the design-system chart tokens (defined in globals.css) so slices are
// distinguishable without hardcoding colors.
const CHART_TOKENS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const CENTER = 50;
const OUTER = 44;
const INNER = 30;

/** Point on a circle, with 0° at the top and angles increasing clockwise. */
function point(radius: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CENTER + radius * Math.sin(rad), CENTER - radius * Math.cos(rad)];
}

/** SVG path for a pie wedge from `a0` to `a1` degrees (hole punched separately). */
function wedgePath(a0: number, a1: number): string {
  const [x0, y0] = point(OUTER, a0);
  const [x1, y1] = point(OUTER, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x0} ${y0} A ${OUTER} ${OUTER} 0 ${large} 1 ${x1} ${y1} Z`;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * Donut chart of income by category. Hand-built SVG (the app ships no charting
 * library) using the theme's chart tokens. Hovering a slice — or its legend
 * row — emphasizes that category and shows its total in the center. The visual
 * is aria-hidden; the legend list carries the same name / share / amount data.
 */
export function IncomeDonut({ slices }: { slices: IncomeSlice[] }) {
  const [active, setActive] = useState<number | null>(null);
  const total = slices.reduce((sum, s) => sum + s.total, 0);

  if (total <= 0) {
    return (
      <div className="border-border bg-paper-deep/35 rounded-xl border border-dashed px-4 py-10 text-center">
        <p className="text-muted-foreground text-sm">No income recorded yet.</p>
      </div>
    );
  }

  const fractions = slices.map((s) => s.total / total);
  const single = slices.length === 1;

  const wedges = fractions.map((fraction, index) => {
    // Start angle is the sum of all preceding fractions.
    const start =
      fractions.slice(0, index).reduce((sum, f) => sum + f, 0) * 360;
    return {
      start,
      end: start + fraction * 360,
      color: CHART_TOKENS[index % CHART_TOKENS.length],
    };
  });

  const center =
    active === null
      ? { label: "Total income", value: usd.format(total), percent: null }
      : {
          label: slices[active].name,
          value: usd.format(slices[active].total),
          percent: Math.round(fractions[active] * 100),
        };

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-7">
      <div className="relative size-36 shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="size-full"
          role="img"
          aria-hidden="true"
        >
          {single ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={OUTER}
              fill={wedges[0].color}
              onMouseEnter={() => setActive(0)}
              onMouseLeave={() => setActive(null)}
            />
          ) : (
            wedges.map((w, index) => (
              <path
                key={index}
                d={wedgePath(w.start, w.end)}
                fill={w.color}
                className="transition-opacity duration-150"
                style={{
                  opacity: active !== null && active !== index ? 0.35 : 1,
                }}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
              />
            ))
          )}
          {/* Punch the donut hole. */}
          <circle cx={CENTER} cy={CENTER} r={INNER} fill="var(--color-card)" />
        </svg>

        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          data-testid="donut-center"
        >
          <span className="text-muted-foreground font-data text-[0.5rem] font-semibold tracking-[0.1em] uppercase">
            {center.percent !== null ? `${center.percent}%` : center.label}
          </span>
          <span className="font-data mt-0.5 max-w-full truncate text-[0.6875rem] font-semibold tabular-nums">
            {center.value}
          </span>
          {center.percent !== null ? (
            <span className="text-muted-foreground mt-0.5 max-w-full truncate text-[0.5625rem]">
              {center.label}
            </span>
          ) : null}
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 flex-col gap-1">
        {slices.map((slice, index) => (
          <li
            key={slice.name}
            aria-label={slice.name}
            onMouseEnter={() => setActive(index)}
            onMouseLeave={() => setActive(null)}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors",
              active === index && "bg-paper-deep/60",
              active !== null && active !== index && "opacity-45",
            )}
          >
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: CHART_TOKENS[index % CHART_TOKENS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {slice.name}
            </span>
            <span className="text-muted-foreground font-data shrink-0 text-xs tabular-nums">
              {Math.round(fractions[index] * 100)}%
            </span>
            <MoneyAmount
              value={slice.total}
              className="font-data w-24 shrink-0 text-right text-xs font-semibold"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
