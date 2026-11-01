import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "../app-header";
import { CategoryManager } from "./category-manager";
import { IncomeCategoryManager } from "./income-category-manager";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this route; this is defense in depth.
  if (!user) {
    redirect("/login");
  }

  const [{ data: incomeCategories }, { data: expenseCategories }] =
    await Promise.all([
      supabase
        .from("income_categories")
        .select("id, name")
        .order("name", { ascending: true }),
      supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

  return (
    <div className="min-h-svh">
      <AppHeader email={user.email ?? ""} active="categories" />

      <main className="ledger-enter mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mb-8 lg:mb-10">
          <div className="mb-3 flex items-center gap-3">
            <span className="bg-primary h-px w-8" />
            <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.15em] uppercase">
              Classification index / All categories
            </p>
          </div>
          <h1 className="font-heading text-4xl leading-none font-semibold tracking-[-0.055em] sm:text-5xl">
            Categories
          </h1>
          <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-relaxed sm:text-base">
            Manage your income and expense categories in one place.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="income-categories-heading"
            className="border-border bg-card shadow-ledger overflow-hidden rounded-2xl border"
          >
            <div className="border-border bg-paper-deep/45 flex items-center justify-between gap-4 border-b px-5 py-5 sm:px-6">
              <div>
                <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
                  Income / 01
                </p>
                <h2
                  id="income-categories-heading"
                  className="font-heading mt-2 text-2xl leading-none font-semibold tracking-[-0.04em]"
                >
                  Income categories
                </h2>
              </div>
              <span className="border-border bg-card text-muted-foreground rounded-full border px-3 py-1.5 font-mono text-[0.625rem] font-semibold tabular-nums">
                {String(incomeCategories?.length ?? 0).padStart(2, "0")}
              </span>
            </div>
            <div className="p-5 sm:p-6">
              <IncomeCategoryManager categories={incomeCategories ?? []} />
            </div>
          </section>

          <section
            aria-labelledby="expense-categories-heading"
            className="border-border bg-card shadow-ledger overflow-hidden rounded-2xl border"
          >
            <div className="border-border bg-paper-deep/45 flex items-center justify-between gap-4 border-b px-5 py-5 sm:px-6">
              <div>
                <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
                  Expenses / 02
                </p>
                <h2
                  id="expense-categories-heading"
                  className="font-heading mt-2 text-2xl leading-none font-semibold tracking-[-0.04em]"
                >
                  Expense categories
                </h2>
              </div>
              <span className="border-border bg-card text-muted-foreground rounded-full border px-3 py-1.5 font-mono text-[0.625rem] font-semibold tabular-nums">
                {String(expenseCategories?.length ?? 0).padStart(2, "0")}
              </span>
            </div>
            <div className="p-5 sm:p-6">
              <CategoryManager categories={expenseCategories ?? []} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
