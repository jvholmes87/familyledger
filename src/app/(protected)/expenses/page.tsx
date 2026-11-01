import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button, buttonVariants } from "@/components/ui/button";
import { MoneyAmount } from "@/components/money-amount";
import { AppHeader } from "../app-header";
import { ExpenseForm } from "./expense-form";
import { deleteExpense } from "./actions";
import { expenseActionLabel } from "./expense-label";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this route; this is defense in depth.
  if (!user) {
    redirect("/login");
  }

  const [{ data: categories }, { data: expenses }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("expenses")
      .select(
        "id, amount, expense_date, description, category_id, categories(name)",
      )
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-svh">
      <AppHeader email={user.email ?? ""} active="expenses" />

      <main className="ledger-enter mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mb-8 lg:mb-10">
          <div className="mb-3 flex items-center gap-3">
            <span className="bg-primary h-px w-8" />
            <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.15em] uppercase">
              Entry register / All expenses
            </p>
          </div>
          <h1 className="font-heading text-4xl leading-none font-semibold tracking-[-0.055em] sm:text-5xl">
            Expenses
          </h1>
          <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-relaxed sm:text-base">
            Log what you spend and keep it organized.
          </p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:gap-6">
          <section className="border-border bg-card shadow-ledger overflow-hidden rounded-2xl border lg:sticky lg:top-28">
            <div className="border-border bg-paper-deep/45 border-b px-5 py-5 sm:px-6">
              <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
                New entry / 01
              </p>
              <h2 className="font-heading mt-2 text-2xl leading-none font-semibold tracking-[-0.04em]">
                Add an expense
              </h2>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                Record the amount first. Add context only where it helps.
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <ExpenseForm categories={categories ?? []} />
            </div>
          </section>

          <section
            aria-labelledby="expense-register-heading"
            className="min-w-0"
          >
            <div className="mb-4 flex items-end justify-between gap-4 px-1">
              <div>
                <p className="font-data text-muted-foreground text-[0.625rem] font-semibold tracking-[0.12em] uppercase">
                  Register / 02
                </p>
                <h2
                  id="expense-register-heading"
                  className="font-heading mt-1.5 text-2xl font-semibold tracking-[-0.04em]"
                >
                  Recent entries
                </h2>
              </div>
              <span className="border-border bg-card text-muted-foreground rounded-full border px-3 py-1.5 font-mono text-[0.625rem] font-semibold tabular-nums">
                {String(expenses?.length ?? 0).padStart(2, "0")} total
              </span>
            </div>

            {expenses && expenses.length > 0 ? (
              <ul className="border-border bg-card shadow-ledger divide-border divide-y overflow-hidden rounded-2xl border">
                {expenses.map((expense, index) => {
                  const labelDetails = {
                    description: expense.description,
                    expenseDate: expense.expense_date,
                    amount: Number(expense.amount),
                    categoryName: expense.categories?.name ?? null,
                  };
                  return (
                    <li
                      key={expense.id}
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
                          {expense.description ?? "—"}
                        </p>
                        <p className="text-muted-foreground mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1 text-xs">
                          <time
                            dateTime={expense.expense_date}
                            className="shrink-0"
                          >
                            {expense.expense_date}
                          </time>
                          <span aria-hidden="true">·</span>
                          <span className="min-w-0 break-all">
                            {expense.categories?.name ?? "Uncategorized"}
                          </span>
                        </p>
                      </div>
                      <MoneyAmount
                        value={Number(expense.amount)}
                        className="font-data text-sm font-semibold"
                      />
                      <div className="col-span-2 col-start-2 flex items-center gap-1 sm:justify-end">
                        <Link
                          href={`/expenses/${expense.id}/edit`}
                          aria-label={expenseActionLabel(
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
                        <form action={deleteExpense}>
                          <input type="hidden" name="id" value={expense.id} />
                          <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            className="min-h-11"
                            aria-label={expenseActionLabel(
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
                <p className="mt-4 text-sm font-semibold">No expenses yet.</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Add your first one using the entry form.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
