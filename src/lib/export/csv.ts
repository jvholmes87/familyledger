type ExpenseExportRow = {
  id: string;
  amount: number;
  expense_date: string;
  description: string | null;
  category_id: string | null;
  created_at: string;
  categories: { name: string } | null;
};

type IncomeExportRow = {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  interval_count: number;
  days_of_month: number[];
  start_date: string;
  end_date: string | null;
  category_id: string | null;
  created_at: string;
  income_categories: { name: string } | null;
};

type CategoryExportRow = {
  id: string;
  name: string;
  created_at: string;
};

export type DataExport = {
  expenses: ExpenseExportRow[];
  incomeSeries: IncomeExportRow[];
  expenseCategories: CategoryExportRow[];
  incomeCategories: CategoryExportRow[];
};

export const SPENDWISE_CSV_HEADERS = [
  "Record Type",
  "Record ID",
  "Name / Description",
  "Amount",
  "Date",
  "End Date",
  "Frequency",
  "Interval",
  "Days of Month",
  "Category",
  "Category ID",
  "Created At",
];

function csvCell(value: string | number | null): string {
  if (value === null || value === "") return "";

  let text = String(value);
  if (/^'*[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function csvRow(values: (string | number | null)[]): string {
  return values.map(csvCell).join(",");
}

/** Build one UTF-8, Excel-friendly CSV containing every user-owned data table. */
export function buildDataExportCsv(data: DataExport): string {
  const rows: (string | number | null)[][] = [SPENDWISE_CSV_HEADERS];

  for (const expense of data.expenses) {
    rows.push([
      "Expense",
      expense.id,
      expense.description,
      expense.amount,
      expense.expense_date,
      null,
      null,
      null,
      null,
      expense.categories?.name ?? "Uncategorized",
      expense.category_id,
      expense.created_at,
    ]);
  }

  for (const income of data.incomeSeries) {
    rows.push([
      "Income Source",
      income.id,
      income.name,
      income.amount,
      income.start_date,
      income.end_date,
      income.frequency,
      income.interval_count,
      income.days_of_month.join(" / "),
      income.income_categories?.name ?? "Uncategorized",
      income.category_id,
      income.created_at,
    ]);
  }

  for (const category of data.expenseCategories) {
    rows.push([
      "Expense Category",
      category.id,
      category.name,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      category.created_at,
    ]);
  }

  for (const category of data.incomeCategories) {
    rows.push([
      "Income Category",
      category.id,
      category.name,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      category.created_at,
    ]);
  }

  return `\uFEFF${rows.map(csvRow).join("\r\n")}\r\n`;
}
