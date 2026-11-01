import { SPENDWISE_CSV_HEADERS } from "@/lib/export/csv";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 10_000;

const FREQUENCIES = new Set([
  "one_time",
  "every_n_days",
  "every_n_weeks",
  "every_n_months",
  "every_n_years",
  "days_of_month",
]);

type ImportedCategory = { externalId: string; name: string; createdAt: string };
type ImportedExpense = {
  externalId: string;
  description: string | null;
  amount: number;
  expenseDate: string;
  categoryExternalId: string | null;
  createdAt: string;
};
type ImportedIncomeSource = {
  externalId: string;
  name: string;
  amount: number;
  startDate: string;
  endDate: string | null;
  frequency: string;
  intervalCount: number;
  daysOfMonth: number[];
  categoryExternalId: string | null;
  createdAt: string;
};

export type SpendWiseImport = {
  expenses: ImportedExpense[];
  incomeSources: ImportedIncomeSource[];
  expenseCategories: ImportedCategory[];
  incomeCategories: ImportedCategory[];
};

export class CsvImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvImportError";
  }
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closedQuote = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (closedQuote && char !== "," && char !== "\r" && char !== "\n") {
      throw new CsvImportError("Malformed CSV quoting");
    }

    if (char === '"') {
      if (cell !== "" || closedQuote) {
        throw new CsvImportError("Malformed CSV quoting");
      }
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
      closedQuote = false;
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      closedQuote = false;
    } else {
      cell += char;
    }
  }

  if (quoted) throw new CsvImportError("Malformed CSV quoting");
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function assertEmpty(row: string[], indexes: number[], rowNumber: number) {
  if (indexes.some((index) => row[index] !== "")) {
    throw new CsvImportError(
      `Row ${rowNumber} has fields not used by its record type`,
    );
  }
}

function required(value: string, field: string, rowNumber: number): string {
  if (value.trim() === "")
    throw new CsvImportError(`Row ${rowNumber} is missing ${field}`);
  return value;
}

function exportedText(value: string): string {
  return /^'+[=+\-@\t\r]/.test(value) ? value.slice(1) : value;
}

function validDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() + 1 === Number(match[2]) &&
    date.getUTCDate() === Number(match[3])
  );
}

function date(value: string, field: string, rowNumber: number): string {
  if (!validDate(value))
    throw new CsvImportError(`Row ${rowNumber} has invalid ${field}`);
  return value;
}

function timestamp(value: string, rowNumber: number): string {
  if (value === "" || Number.isNaN(Date.parse(value))) {
    throw new CsvImportError(`Row ${rowNumber} has invalid Created At`);
  }
  return value;
}

function amount(value: string, rowNumber: number): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
    throw new CsvImportError(`Row ${rowNumber} has invalid Amount`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed > 9_999_999_999.99) {
    throw new CsvImportError(`Row ${rowNumber} has invalid Amount`);
  }
  return parsed;
}

function interval(value: string, rowNumber: number): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new CsvImportError(`Row ${rowNumber} has invalid Interval`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new CsvImportError(`Row ${rowNumber} has invalid Interval`);
  }
  return parsed;
}

function days(value: string, frequency: string, rowNumber: number): number[] {
  if (value === "") {
    if (frequency === "days_of_month") {
      throw new CsvImportError(`Row ${rowNumber} is missing Days of Month`);
    }
    return [];
  }
  if (frequency !== "days_of_month") {
    throw new CsvImportError(`Row ${rowNumber} has invalid Days of Month`);
  }
  const parsed = value.split(" / ").map(Number);
  if (
    parsed.some((day) => !Number.isInteger(day) || day < 0 || day > 31) ||
    new Set(parsed).size !== parsed.length
  ) {
    throw new CsvImportError(`Row ${rowNumber} has invalid Days of Month`);
  }
  return parsed;
}

function category(row: string[], rowNumber: number): ImportedCategory {
  assertEmpty(row, [3, 4, 5, 6, 7, 8, 9, 10], rowNumber);
  const externalId = required(row[1], "Record ID", rowNumber);
  const name = exportedText(
    required(row[2], "Name / Description", rowNumber).trim(),
  );
  if (name.length > 60)
    throw new CsvImportError(`Row ${rowNumber} has invalid category name`);
  const createdAt = timestamp(row[11], rowNumber);
  return { externalId, name, createdAt };
}

/** Parse and fully validate a CSV produced by SpendWise's unified export. */
export function parseSpendWiseCsv(source: string): SpendWiseImport {
  const byteLength = new TextEncoder().encode(source).byteLength;
  if (byteLength > MAX_IMPORT_BYTES)
    throw new CsvImportError("CSV exceeds the 5 MiB limit");

  const text = source.startsWith("\uFEFF") ? source.slice(1) : source;
  const rows = parseCsv(text);
  if (rows.length === 0) throw new CsvImportError("CSV is empty");
  if (
    rows[0].length !== SPENDWISE_CSV_HEADERS.length ||
    rows[0].some((cell, index) => cell !== SPENDWISE_CSV_HEADERS[index])
  ) {
    throw new CsvImportError(
      "CSV header does not match the SpendWise export schema",
    );
  }
  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new CsvImportError("CSV exceeds the 10,000 row limit");
  }

  const result: SpendWiseImport = {
    expenses: [],
    incomeSources: [],
    expenseCategories: [],
    incomeCategories: [],
  };
  const ids = new Set<string>();

  for (const [index, row] of dataRows.entries()) {
    const rowNumber = index + 2;
    if (row.length !== SPENDWISE_CSV_HEADERS.length) {
      throw new CsvImportError(
        `Row ${rowNumber} must contain exactly 12 columns`,
      );
    }
    const recordType = required(row[0], "Record Type", rowNumber);
    const externalId = required(row[1], "Record ID", rowNumber);
    if (ids.has(externalId))
      throw new CsvImportError(`Row ${rowNumber} has a duplicate Record ID`);
    ids.add(externalId);

    if (recordType === "Expense Category") {
      result.expenseCategories.push(category(row, rowNumber));
      continue;
    }
    if (recordType === "Income Category") {
      result.incomeCategories.push(category(row, rowNumber));
      continue;
    }
    if (recordType === "Expense") {
      assertEmpty(row, [5, 6, 7, 8], rowNumber);
      const createdAt = timestamp(row[11], rowNumber);
      result.expenses.push({
        externalId,
        description: row[2] === "" ? null : exportedText(row[2]),
        amount: amount(required(row[3], "Amount", rowNumber), rowNumber),
        expenseDate: date(
          required(row[4], "Date", rowNumber),
          "Date",
          rowNumber,
        ),
        categoryExternalId: row[10] === "" ? null : row[10],
        createdAt,
      });
      continue;
    }
    if (recordType === "Income Source") {
      const frequency = required(row[6], "Frequency", rowNumber);
      if (!FREQUENCIES.has(frequency)) {
        throw new CsvImportError(`Row ${rowNumber} has invalid Frequency`);
      }
      const createdAt = timestamp(row[11], rowNumber);
      const startDate = date(
        required(row[4], "Date", rowNumber),
        "Date",
        rowNumber,
      );
      const endDate =
        row[5] === "" ? null : date(row[5], "End Date", rowNumber);
      if (endDate !== null && endDate < startDate) {
        throw new CsvImportError(
          `Row ${rowNumber} has an End Date before its Date`,
        );
      }
      const name = exportedText(
        required(row[2], "Name / Description", rowNumber).trim(),
      );
      if (name.length > 120)
        throw new CsvImportError(`Row ${rowNumber} has invalid name`);
      result.incomeSources.push({
        externalId,
        name,
        amount: amount(required(row[3], "Amount", rowNumber), rowNumber),
        startDate,
        endDate,
        frequency,
        intervalCount: interval(
          required(row[7], "Interval", rowNumber),
          rowNumber,
        ),
        daysOfMonth: days(row[8], frequency, rowNumber),
        categoryExternalId: row[10] === "" ? null : row[10],
        createdAt,
      });
      continue;
    }
    throw new CsvImportError(`Row ${rowNumber} has an unknown Record Type`);
  }

  const expenseCategoryIds = new Set(
    result.expenseCategories.map((item) => item.externalId),
  );
  const incomeCategoryIds = new Set(
    result.incomeCategories.map((item) => item.externalId),
  );
  for (const expense of result.expenses) {
    if (
      expense.categoryExternalId &&
      !expenseCategoryIds.has(expense.categoryExternalId)
    ) {
      throw new CsvImportError(
        `Expense ${expense.externalId} references an unknown expense category`,
      );
    }
  }
  for (const income of result.incomeSources) {
    if (
      income.categoryExternalId &&
      !incomeCategoryIds.has(income.categoryExternalId)
    ) {
      throw new CsvImportError(
        `Income Source ${income.externalId} references an unknown income category`,
      );
    }
  }

  return result;
}
