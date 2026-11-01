const entries = [
  { label: "Home", amount: 1420 },
  { label: "Everyday", amount: 684.2 },
  { label: "Elsewhere", amount: 319.8 },
] as const;

const entryMax = Math.max(...entries.map((entry) => entry.amount));

export function getPreviewBarWidth(amount: number, max: number): number {
  return max <= 0 ? 0 : Math.round((amount / max) * 100);
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

export function LedgerPreview() {
  return (
    <aside
      aria-label="Sample ledger preview"
      className="ledger-enter relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none"
      style={{ animationDelay: "120ms" }}
    >
      <div className="border-foreground/12 bg-paper-raised shadow-ledger-float relative overflow-hidden rounded-[1.75rem] border p-3 sm:p-4">
        <div className="border-border bg-card relative overflow-hidden rounded-[1.3rem] border">
          <div className="bg-primary absolute inset-y-0 left-0 w-1.5" />
          <div className="border-border flex items-center justify-between border-b px-6 py-4 pl-8">
            <div>
              <p className="font-data text-muted-foreground text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
                Personal ledger / 07
              </p>
              <p className="font-heading mt-1 text-lg font-semibold tracking-[-0.03em]">
                July overview
              </p>
            </div>
            <div
              aria-hidden="true"
              className="border-primary/25 text-primary grid size-9 place-items-center rounded-full border font-mono text-[0.625rem] font-bold"
            >
              SW
            </div>
          </div>

          <div className="grid md:grid-cols-[1.05fr_0.95fr]">
            <div className="ledger-rule border-border border-b px-6 py-7 pl-8 md:border-r md:border-b-0">
              <p className="text-muted-foreground text-xs font-medium">
                Month to date
              </p>
              <p className="font-heading mt-2 text-4xl leading-none font-semibold tracking-[-0.055em] sm:text-5xl">
                $2,424
                <span className="text-muted-foreground text-[0.55em]">.00</span>
              </p>
              <div className="mt-8 flex items-end gap-2" aria-hidden="true">
                {[34, 51, 42, 66, 48, 82, 58, 91, 74, 62, 87, 100].map(
                  (height, index) => (
                    <span
                      // Static sample chart; position is the stable identity.
                      key={index}
                      className="bg-primary/18 relative h-20 flex-1 overflow-hidden rounded-sm"
                    >
                      <span
                        className="bg-primary absolute inset-x-0 bottom-0 rounded-sm"
                        style={{ height: `${height}%` }}
                      />
                    </span>
                  ),
                )}
              </div>
              <div className="text-muted-foreground mt-2 flex justify-between font-mono text-[0.5625rem] uppercase">
                <span>Week 01</span>
                <span>Week 04</span>
              </div>
            </div>

            <div className="px-6 py-7">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">By category</p>
                <p className="font-data text-muted-foreground text-[0.5625rem] tracking-[0.1em] uppercase">
                  03 entries
                </p>
              </div>
              <ul className="mt-6 space-y-5">
                {entries.map((entry, index) => (
                  <li key={entry.label}>
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <span className="flex items-center gap-2 font-medium">
                        <span
                          aria-hidden="true"
                          className="font-data text-muted-foreground text-[0.5625rem]"
                        >
                          0{index + 1}
                        </span>
                        {entry.label}
                      </span>
                      <span className="font-data tabular-nums">
                        {formatAmount(entry.amount)}
                      </span>
                    </div>
                    <div className="bg-paper-deep mt-2 h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${getPreviewBarWidth(entry.amount, entryMax)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-border bg-paper-deep/55 flex items-center justify-between border-t px-6 py-3 pl-8">
            <span className="text-muted-foreground text-[0.6875rem]">
              Last entry · Today
            </span>
            <span className="font-data text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
              Balanced
            </span>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="border-primary/25 absolute -right-3 -bottom-3 -z-10 h-24 w-24 rounded-br-[2.5rem] border-r border-b sm:-right-5 sm:-bottom-5"
      />
    </aside>
  );
}
