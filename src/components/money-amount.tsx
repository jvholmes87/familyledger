import { cn } from "@/lib/utils";

type MoneyAmountProps = {
  /** Amount in dollars. Negative values represent money out. */
  value: number;
  /** Show an explicit +/- sign and color the value (for deltas). */
  showSign?: boolean;
  currency?: string;
  className?: string;
};

/**
 * Renders a currency value with tabular numerals so columns align.
 * When `showSign` is set, positive values are tinted with the positive
 * token and negatives with the negative token (used for deltas).
 */
export function MoneyAmount({
  value,
  showSign = false,
  currency = "USD",
  className,
}: MoneyAmountProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    signDisplay: showSign ? "exceptZero" : "auto",
  }).format(value);

  return (
    <span
      className={cn(
        "tabular-nums",
        showSign && value > 0 && "text-positive",
        showSign && value < 0 && "text-negative",
        className,
      )}
    >
      {formatted}
    </span>
  );
}
