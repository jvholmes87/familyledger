import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button, buttonVariants } from "@/components/ui/button";
import { MoneyAmount } from "@/components/money-amount";
import { shortFrequencyLabel } from "@/lib/income/frequency";
import { nextOccurrences, type FrequencyKind } from "@/lib/income/occurrences";
import type { IncomeSeriesRecord } from "@/lib/income/summary";
import { AppHeader } from "../app-header";
import { IncomeForm } from "./income-form";
import { IncomeMix } from "./income-mix";
import { deleteIncomeSeries } from "./actions";
import { incomeActionLabel } from "./income-label";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export default async function IncomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this route; this is defense in depth.
  if (!user) {
    redirect("/login");
  }

  const [{ data: categories }, { data: series }] = await Promise.all([
    supabase.from("income_categories").select("id, name").order("name"),
    supabase
      .from("income_series")
      .select(
        "id, name, amount, frequency, interval_count, days_of_month, start_date, end_date, category_id, income_categories(name)",
      )
      .order("start_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const rows = series ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Full record set powers the period-selectable income mix (computed client-side).
  const records: IncomeSeriesRecord[] = rows.map((s) => ({
    amount: Number(s.amount),
    frequency: s.frequency as FrequencyKind,
    interval: s.interval_count,
    days_of_month: s.days_of_month,
    start_date: s.start_date,
    end_date: s.end_date,
    category_name: s.income_categories?.name ?? null,
  }));
  // Earliest income start anchors the "All time" option.
  const earliest = records.map((r) => r.start_date).sort()[0];

  return (
    <div className="min-h-svh">
      <AppHeader email={user.email ?? ""} active="income" />

      <main className="ledger-enter mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end lg:mb-10">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="bg-primary h-px w-8" />
              <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.15em] uppercase">
                Income register / All sources
              </p>
            </div>
            <h1 className="font-heading text-4xl leading-none font-semibold tracking-[-0.055em] sm:text-5xl">
              Income
            </h1>
            <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-relaxed sm:text-base">
              Track every source — recurring or one-off — and see how they add
              up.
            </p>
          </div>
          <Link
            href="/categories"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Manage categories
          </Link>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:gap-6">
          <div className="flex flex-col gap-5">
            <section className="border-border bg-card shadow-ledger overflow-hidden rounded-2xl border">
              <div className="border-border bg-paper-deep/45 border-b px-5 py-5 sm:px-6">
                <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
                  New source / 01
                </p>
                <h2 className="font-heading mt-2 text-2xl leading-none font-semibold tracking-[-0.04em]">
                  Add income
                </h2>
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                  Name it, set the amount, and choose how often it arrives.
                </p>
              </div>
              <div className="p-5 sm:p-6">
                <IncomeForm categories={categories ?? []} today={today} />
              </div>
            </section>

            <section
              aria-labelledby="income-mix-heading"
              className="border-border bg-card shadow-ledger overflow-hidden rounded-2xl border"
            >
              <div className="border-border border-b px-5 py-5 sm:px-6">
                <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
                  Distribution / 02
                </p>
                <h2
                  id="income-mix-heading"
                  className="font-heading mt-2 text-2xl leading-none font-semibold tracking-[-0.04em]"
                >
                  Income mix
                </h2>
              </div>
              <div className="p-5 sm:p-6">
                <IncomeMix
                  records={records}
                  today={today}
                  earliest={earliest}
                />
              </div>
            </section>
          </div>

          <section
            aria-labelledby="income-register-heading"
            className="min-w-0"
          >
            <div className="mb-4 flex items-end justify-between gap-4 px-1">
              <div>
                <p className="font-data text-muted-foreground text-[0.625rem] font-semibold tracking-[0.12em] uppercase">
                  Register / 03
                </p>
                <h2
                  id="income-register-heading"
                  className="font-heading mt-1.5 text-2xl font-semibold tracking-[-0.04em]"
                >
                  Income sources
                </h2>
              </div>
              <span className="border-border bg-card text-muted-foreground rounded-full border px-3 py-1.5 font-mono text-[0.625rem] font-semibold tabular-nums">
                {String(rows.length).padStart(2, "0")} total
              </span>
            </div>

            {rows.length > 0 ? (
              <ul className="border-border bg-card shadow-ledger divide-border divide-y overflow-hidden rounded-2xl border">
                {rows.map((s, index) => {
                  const schedule = {
                    frequency: s.frequency as FrequencyKind,
                    interval: s.interval_count,
                    days_of_month: s.days_of_month,
                    start_date: s.start_date,
                    end_date: s.end_date,
                  };
                  const frequencyLabel = shortFrequencyLabel(schedule);
                  const upcoming = nextOccurrences(schedule, today, 1)[0];
                  const labelDetails = {
                    name: s.name,
                    amount: Number(s.amount),
                    frequencyLabel,
                  };
                  return (
                    <li
                      key={s.id}
                      className="group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-4 sm:gap-x-4 sm:px-5"
                    >
                      <span
                        aria-hidden="true"
                        className="border-border text-muted-foreground group-hover:border-primary/30 group-hover:text-primary grid size-8 place-items-center rounded-full border font-mono text-[0.5625rem] transition-colors"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {s.name}
                        </p>
                        <p className="text-muted-foreground mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-xs">
                          <span className="border-border bg-paper-deep/60 shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.5625rem] font-semibold tracking-wide uppercase">
                            {frequencyLabel}
                          </span>
                          <span className="min-w-0 break-all">
                            {s.income_categories?.name ?? "Uncategorized"}
                          </span>
                          {upcoming ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="shrink-0">
                                next {formatDate(upcoming)}
                              </span>
                            </>
                          ) : null}
                        </p>
                      </div>
                      <MoneyAmount
                        value={Number(s.amount)}
                        className="font-data text-sm font-semibold"
                      />
                      <div className="col-span-2 col-start-2 flex items-center gap-1 sm:justify-end">
                        <Link
                          href={`/income/${s.id}/edit`}
                          aria-label={incomeActionLabel(
                            "Edit",
                            index,
                            labelDetails,
                          )}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                            className: "min-h-11",
                          })}
                        >
                          Edit
                        </Link>
                        <form action={deleteIncomeSeries}>
                          <input type="hidden" name="id" value={s.id} />
                          <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            className="min-h-11"
                            aria-label={incomeActionLabel(
                              "Delete",
                              index,
                              labelDetails,
                            )}
                          >
                            Delete
                          </Button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="border-border bg-card shadow-ledger rounded-2xl border border-dashed px-6 py-14 text-center">
                <span
                  aria-hidden="true"
                  className="border-border text-muted-foreground mx-auto grid size-11 place-items-center rounded-full border font-mono text-[0.625rem]"
                >
                  00
                </span>
                <p className="mt-4 text-sm font-semibold">No income yet.</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Add your first source using the form.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
