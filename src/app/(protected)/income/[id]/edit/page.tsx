import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FrequencyKind } from "@/lib/income/occurrences";
import { AppHeader } from "../../../app-header";
import { IncomeForm, type IncomeSeriesFormValue } from "../../income-form";

export default async function EditIncomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: categories }, { data: series }] = await Promise.all([
    supabase.from("income_categories").select("id, name").order("name"),
    supabase
      .from("income_series")
      .select(
        "id, name, amount, frequency, interval_count, days_of_month, start_date, end_date, category_id",
      )
      .eq("id", id)
      .maybeSingle(),
  ]);

  // RLS scopes this to the owner; a missing row is a 404.
  if (!series) {
    notFound();
  }

  const value: IncomeSeriesFormValue = {
    id: series.id,
    name: series.name,
    amount: Number(series.amount),
    category_id: series.category_id,
    frequency: series.frequency as FrequencyKind,
    interval_count: series.interval_count,
    days_of_month: series.days_of_month,
    start_date: series.start_date,
    end_date: series.end_date,
  };

  return (
    <div className="min-h-svh">
      <AppHeader email={user.email ?? ""} active="income" />

      <main className="ledger-enter mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <span className="bg-primary h-px w-8" />
            <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.15em] uppercase">
              Income register / Edit source
            </p>
          </div>
          <h1 className="font-heading text-4xl leading-none font-semibold tracking-[-0.055em] sm:text-5xl">
            Edit income
          </h1>
        </div>

        <section className="border-border bg-card shadow-ledger overflow-hidden rounded-2xl border">
          <div className="p-5 sm:p-6">
            <IncomeForm categories={categories ?? []} series={value} />
          </div>
        </section>
      </main>
    </div>
  );
}
