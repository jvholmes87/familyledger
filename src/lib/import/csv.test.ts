import { describe, expect, it } from "vitest";
import { MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, parseSpendWiseCsv } from "./csv";

const header =
  "Record Type,Record ID,Name / Description,Amount,Date,End Date,Frequency,Interval,Days of Month,Category,Category ID,Created At";

describe("parseSpendWiseCsv", () => {
  it("parses the exact BOM-prefixed export schema and all four record types", () => {
    const csv =
      `\uFEFF${header}\r\n` +
      'Expense,expense-1,"Groceries,\r\nweekly",42.50,2026-07-01,,,,,Groceries,expense-category-1,2026-07-01T12:00:00Z\r\n' +
      'Income Source,income-1,"Salary ""primary""",5000,2026-01-01,,days_of_month,1,1 / 15,Wages,income-category-1,2026-01-01T12:00:00Z\r\n' +
      "Expense Category,expense-category-1,Groceries,,,,,,,,,2026-01-01T12:00:00Z\r\n" +
      "Income Category,income-category-1,Wages,,,,,,,,,2026-01-01T12:00:00Z\r\n";

    expect(parseSpendWiseCsv(csv)).toEqual({
      expenses: [
        {
          externalId: "expense-1",
          description: "Groceries,\r\nweekly",
          amount: 42.5,
          expenseDate: "2026-07-01",
          categoryExternalId: "expense-category-1",
          createdAt: "2026-07-01T12:00:00Z",
        },
      ],
      incomeSources: [
        {
          externalId: "income-1",
          name: 'Salary "primary"',
          amount: 5000,
          startDate: "2026-01-01",
          endDate: null,
          frequency: "days_of_month",
          intervalCount: 1,
          daysOfMonth: [1, 15],
          categoryExternalId: "income-category-1",
          createdAt: "2026-01-01T12:00:00Z",
        },
      ],
      expenseCategories: [
        {
          externalId: "expense-category-1",
          name: "Groceries",
          createdAt: "2026-01-01T12:00:00Z",
        },
      ],
      incomeCategories: [
        {
          externalId: "income-category-1",
          name: "Wages",
          createdAt: "2026-01-01T12:00:00Z",
        },
      ],
    });
  });

  it("reverses export-only formula guards without evaluating the text", () => {
    const csv =
      `${header}\n` +
      "Expense,expense-1,'=SUM(1+1),1.25,2026-07-01,,,,,Uncategorized,,2026-07-01T00:00:00Z\n" +
      "Expense,expense-2,''=literal apostrophe,2.50,2026-07-02,,,,,Uncategorized,,2026-07-02T00:00:00Z\n" +
      "Expense,expense-3,'''=two literal apostrophes,3.50,2026-07-03,,,,,Uncategorized,,2026-07-03T00:00:00Z\n";

    expect(
      parseSpendWiseCsv(csv).expenses.map((item) => item.description),
    ).toEqual([
      "=SUM(1+1)",
      "'=literal apostrophe",
      "''=two literal apostrophes",
    ]);
  });

  it("rejects malformed quoting and a non-SpawnWise header", () => {
    expect(() => parseSpendWiseCsv(`${header}\n\"unterminated`)).toThrow(
      /malformed csv quoting/i,
    );
    expect(() => parseSpendWiseCsv(`Different Header\nvalue`)).toThrow(
      /header.*SpendWise export schema/i,
    );
  });

  it("rejects unknown record types and unresolved category references", () => {
    expect(() =>
      parseSpendWiseCsv(
        `${header}\nTransfer,id-1,Transfer,1,2026-01-01,,,,,,,2026-01-01T00:00:00Z\n`,
      ),
    ).toThrow(/unknown Record Type/i);
    expect(() =>
      parseSpendWiseCsv(
        `${header}\nExpense,id-1,Shop,1,2026-01-01,,,,,Food,missing,2026-01-01T00:00:00Z\n`,
      ),
    ).toThrow(/unknown expense category/i);
  });

  it("treats whitespace-only required names as missing", () => {
    expect(() =>
      parseSpendWiseCsv(
        `${header}\nExpense Category,id-1,"   ",,,,,,,,,2026-01-01T00:00:00Z\n`,
      ),
    ).toThrow(/missing Name \/ Description/i);
    expect(() =>
      parseSpendWiseCsv(
        `${header}\nIncome Source,id-1,"   ",1,2026-01-01,,one_time,1,,,,2026-01-01T00:00:00Z\n`,
      ),
    ).toThrow(/missing Name \/ Description/i);
  });

  it.each([
    [
      "invalid date",
      "Income Source,id-1,Salary,1,2026-02-30,,one_time,1,,, ,2026-01-01T00:00:00Z",
    ],
    [
      "invalid number",
      "Income Source,id-1,Salary,-1,2026-02-01,,one_time,1,,,,2026-01-01T00:00:00Z",
    ],
    [
      "invalid frequency",
      "Income Source,id-1,Salary,1,2026-02-01,,monthly,1,,,,2026-01-01T00:00:00Z",
    ],
    [
      "invalid interval",
      "Income Source,id-1,Salary,1,2026-02-01,,one_time,0,,,,2026-01-01T00:00:00Z",
    ],
    [
      "invalid days",
      "Income Source,id-1,Salary,1,2026-02-01,,days_of_month,1,32,,,2026-01-01T00:00:00Z",
    ],
  ])("rejects %s", (_label, row) => {
    expect(() => parseSpendWiseCsv(`${header}\n${row}\n`)).toThrow(/invalid/i);
  });

  it("enforces the byte and data-row limits", () => {
    expect(() => parseSpendWiseCsv("x".repeat(MAX_IMPORT_BYTES + 1))).toThrow(
      /5 MiB/i,
    );
    const rows = Array.from(
      { length: MAX_IMPORT_ROWS + 1 },
      (_, index) =>
        `Expense Category,category-${index},Category ${index},,,,,,,,,2026-01-01T00:00:00Z`,
    );
    expect(() => parseSpendWiseCsv(`${header}\n${rows.join("\n")}\n`)).toThrow(
      /10,000 row/i,
    );
  });
});
