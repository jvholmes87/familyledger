import {
  CsvImportError,
  MAX_IMPORT_BYTES,
  parseSpendWiseCsv,
} from "@/lib/import/csv";
import { createClient } from "@/lib/supabase/server";

type RpcSummary = {
  expenses: number;
  income_sources: number;
  expense_categories: number;
  income_categories: number;
};

function errorResponse(error: string, status: number) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return errorResponse("Authentication required", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("A CSV file is required", 400);
  }

  const files = form.getAll("file");
  if (files.length !== 1 || typeof files[0] === "string") {
    return errorResponse("Exactly one CSV file is required", 400);
  }
  const file = files[0];
  if (file.size > MAX_IMPORT_BYTES) {
    return errorResponse("CSV exceeds the 5 MiB limit", 413);
  }

  let parsed;
  try {
    const bytes = await file.arrayBuffer();
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    parsed = parseSpendWiseCsv(text);
  } catch (error) {
    if (error instanceof CsvImportError) {
      return errorResponse(error.message, 422);
    }
    if (error instanceof TypeError) {
      return errorResponse("CSV must be valid UTF-8", 422);
    }
    return errorResponse("Unable to read CSV", 400);
  }

  const { data, error } = await supabase.rpc("import_spendwise_data", {
    p_import: parsed,
  });
  if (error || !data) {
    console.error("SpendWise data import failed", error);
    return errorResponse("Unable to import data", 500);
  }

  const summary = data as unknown as RpcSummary;
  return Response.json(
    {
      expenses: summary.expenses,
      incomeSources: summary.income_sources,
      expenseCategories: summary.expense_categories,
      incomeCategories: summary.income_categories,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
