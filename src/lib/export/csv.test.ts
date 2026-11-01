import { describe, expect, it } from "vitest";
import { buildDataExportCsv } from "./csv";

describe("buildDataExportCsv", () => {
  it("combines every SpendWise record type into one Excel-compatible CSV", () => {
    const csv = buildDataExportCsv({
      expenses: [
        {
          id: "expense-1",
          amount: 42.5,
          expense_date: "2026-07-01",
          description: "Groceries, weekly",
          category_id: "expense-category-1",
          created_at: "2026-07-01T12:00:00Z",
          categories: { name: "Groceries" },
        },
      ],
      incomeSeries: [
        {
          id: "income-1",
          name: "Salary",
          amount: 5000,
          frequency: "monthly",
          interval_count: 1,
          days_of_month: [1, 15],
          start_date: "2026-01-01",
          end_date: null,
          category_id: "income-category-1",
          created_at: "2026-01-01T12:00:00Z",
          income_categories: { name: "Wages" },
        },
      ],
      expenseCategories: [
        {
          id: "expense-category-1",
          name: "Groceries",
          created_at: "2026-01-01T12:00:00Z",
        },
      ],
      incomeCategories: [
        {
          id: "income-category-1",
          name: "Wages",
          created_at: "2026-01-01T12:00:00Z",
        },
      ],
    });

    expect(csv).toBe(
      "\uFEFFRecord Type,Record ID,Name / Description,Amount,Date,End Date,Frequency,Interval,Days of Month,Category,Category ID,Created At\r\n" +
        'Expense,expense-1,"Groceries, weekly",42.5,2026-07-01,,,,,Groceries,expense-category-1,2026-07-01T12:00:00Z\r\n' +
        "Income Source,income-1,Salary,5000,2026-01-01,,monthly,1,1 / 15,Wages,income-category-1,2026-01-01T12:00:00Z\r\n" +
        "Expense Category,expense-category-1,Groceries,,,,,,,,,2026-01-01T12:00:00Z\r\n" +
        "Income Category,income-category-1,Wages,,,,,,,,,2026-01-01T12:00:00Z\r\n",
    );
  });

  it("escapes quotes and prevents spreadsheet formula injection", () => {
    const csv = buildDataExportCsv({
      expenses: [
        {
          id: "expense-1",
          amount: 1,
          expense_date: "2026-07-01",
          description: '=HYPERLINK("https://example.com","click")',
          category_id: null,
          created_at: "2026-07-01T12:00:00Z",
          categories: null,
        },
      ],
      incomeSeries: [],
      expenseCategories: [],
      incomeCategories: [],
    });

    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"",""click"")"');
    expect(csv).toContain(",Uncategorized,,2026-07-01T12:00:00Z");
  });

  it("escapes an existing literal apostrophe before a formula prefix reversibly", () => {
    const csv = buildDataExportCsv({
      expenses: [
        {
          id: "expense-1",
          amount: 1,
          expense_date: "2026-07-01",
          description: "''=literal",
          category_id: null,
          created_at: "2026-07-01T12:00:00Z",
          categories: null,
        },
      ],
      incomeSeries: [],
      expenseCategories: [],
      incomeCategories: [],
    });

    expect(csv).toContain(",'''=literal,1,");
  });
});
