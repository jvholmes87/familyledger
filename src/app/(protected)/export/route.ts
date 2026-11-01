import { buildDataExportCsv } from "@/lib/export/csv";
import { fetchAllPages } from "@/lib/export/pagination";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Authentication required", { status: 401 });
  }

  try {
    const [expenses, incomeSeries, expenseCategories, incomeCategories] =
      await Promise.all([
        fetchAllPages((from, to) =>
          supabase
            .from("expenses")
            .select(
              "id, amount, expense_date, description, category_id, created_at, categories(name)",
            )
            .order("expense_date", { ascending: true })
            .order("created_at", { ascending: true })
            .range(from, to),
        ),
        fetchAllPages((from, to) =>
          supabase
            .from("income_series")
            .select(
              "id, name, amount, frequency, interval_count, days_of_month, start_date, end_date, category_id, created_at, income_categories(name)",
            )
            .order("start_date", { ascending: true })
            .order("created_at", { ascending: true })
            .range(from, to),
        ),
        fetchAllPages((from, to) =>
          supabase
            .from("categories")
            .select("id, name, created_at")
            .order("name", { ascending: true })
            .range(from, to),
        ),
        fetchAllPages((from, to) =>
          supabase
            .from("income_categories")
            .select("id, name, created_at")
            .order("name", { ascending: true })
            .range(from, to),
        ),
      ]);

    const csv = buildDataExportCsv({
      expenses,
      incomeSeries,
      expenseCategories,
      incomeCategories,
    });
    const date = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="spendwise-data-${date}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("SpendWise data export failed", error);
    return new Response("Unable to export data", { status: 500 });
  }
}
