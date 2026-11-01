import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "../../../app-header";
import { ExpenseForm } from "../../expense-form";

export default async function EditExpensePage({
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

  const [{ data: categories }, { data: expense }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("expenses")
      .select("id, amount, expense_date, description, category_id")
      .eq("id", id)
      .maybeSingle(),
  ]);

  // RLS returns nothing for another user's expense, so this also enforces access.
  if (!expense) {
    notFound();
  }

  return (
    <div className="min-h-svh">
      <AppHeader email={user.email ?? ""} active="expenses" />

      <main className="ledger-enter mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          href="/expenses"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft aria-hidden="true" />
          Back to expenses
        </Link>

        <div className="mt-7 grid items-start gap-5 lg:grid-cols-[0.58fr_1.42fr] lg:gap-6">
          <div className="py-2">
            <div className="mb-3 flex items-center gap-3">
              <span className="bg-primary h-px w-8" />
              <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.15em] uppercase">
                Entry amendment / 01
              </p>
            </div>
            <h1 className="font-heading text-4xl leading-none font-semibold tracking-[-0.055em] sm:text-5xl">
              Edit expense
            </h1>
            <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
              Update the details that changed. Your ledger will keep the revised
              entry in place.
            </p>
          </div>

          <section className="border-border bg-card shadow-ledger-float overflow-hidden rounded-2xl border">
            <div className="border-border bg-paper-deep/45 border-b px-5 py-5 sm:px-6">
              <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
                Expense details / 02
              </p>
              <h2 className="font-heading mt-2 text-2xl leading-none font-semibold tracking-[-0.04em]">
                Revise this entry
              </h2>
            </div>
            <div className="p-5 sm:p-6">
              <ExpenseForm
                categories={categories ?? []}
                expense={{
                  id: expense.id,
                  amount: Number(expense.amount),
                  expense_date: expense.expense_date,
                  description: expense.description,
                  category_id: expense.category_id,
                }}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
