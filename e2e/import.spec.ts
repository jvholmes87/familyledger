import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";

async function signUp(page: Page, prefix: string) {
  const email = `${prefix}+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/login");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
}

async function signOut(page: Page, email: string) {
  await page.getByRole("button", { name: `Account menu for ${email}` }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

test("a complete SpendWise export round-trips additively and malformed input writes nothing", async ({
  page,
}) => {
  const sourceEmail = await signUp(page, "import-source");

  await page.goto("/categories");
  const expenseCategories = page.getByRole("region", {
    name: "Expense categories",
  });
  await expenseCategories
    .getByLabel("Category name")
    .fill("Round Trip Expense");
  await expenseCategories.getByRole("button", { name: "Add category" }).click();
  await expect(
    expenseCategories.getByLabel("Rename Round Trip Expense"),
  ).toBeVisible();
  const incomeCategories = page.getByRole("region", {
    name: "Income categories",
  });
  await incomeCategories
    .getByLabel("Income category name")
    .fill("Round Trip Income");
  await incomeCategories.getByRole("button", { name: "Add category" }).click();
  await expect(
    incomeCategories.getByLabel("Rename Round Trip Income"),
  ).toBeVisible();

  await page.goto("/expenses");
  await page.getByLabel("Amount").fill("42.50");
  await page.getByLabel("Date").fill("2026-07-01");
  await page
    .getByLabel("Category")
    .selectOption({ label: "Round Trip Expense" });
  await page.getByLabel("Description").fill("Imported synthetic shop");
  await page.getByRole("button", { name: "Add expense" }).click();
  await expect(page.getByText("Imported synthetic shop")).toBeVisible();

  await page.goto("/income");
  await page.getByLabel("Name").fill("Imported synthetic salary");
  await page.getByLabel("Amount").fill("1234.56");
  await page
    .getByLabel("Category")
    .selectOption({ label: "Round Trip Income" });
  await page.getByLabel("Frequency").selectOption("one_time");
  await page.getByLabel("Start date").fill("2026-07-02");
  await page.getByRole("button", { name: "Add income" }).click();
  await expect(page.getByText("Imported synthetic salary")).toBeVisible();

  await page.goto("/settings");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Export CSV" }).click(),
  ]);
  const exportedPath = await download.path();
  expect(exportedPath).not.toBeNull();
  const completeCsv = await readFile(exportedPath!, "utf8");
  expect(completeCsv).toContain("Imported synthetic shop");
  expect(completeCsv).toContain("Imported synthetic salary");
  expect(completeCsv).toContain("Round Trip Expense");
  expect(completeCsv).toContain("Round Trip Income");

  await signOut(page, sourceEmail);
  await signUp(page, "import-target");
  await page.goto("/settings");
  await page.getByLabel("SpendWise CSV file").setInputFiles(exportedPath!);
  await page.getByRole("button", { name: "Import CSV" }).click();
  await expect(
    page.getByRole("status", { name: "Import complete" }),
  ).toContainText(
    "Imported 1 expense, 1 income source, 1 expense category, and 1 income category.",
  );

  await page.goto("/expenses");
  const importedExpense = page
    .getByLabel("Recent entries")
    .getByRole("listitem")
    .filter({ hasText: "Imported synthetic shop" });
  await expect(importedExpense).toContainText("Round Trip Expense");
  await page.goto("/income");
  const importedIncome = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: /Delete/ }) })
    .filter({ hasText: "Imported synthetic salary" });
  await expect(importedIncome).toContainText("Round Trip Income");
  await page.goto("/categories");
  await expect(page.getByLabel("Rename Round Trip Expense")).toBeVisible();
  await expect(page.getByLabel("Rename Round Trip Income")).toBeVisible();

  await page.goto("/settings");
  await page.getByLabel("SpendWise CSV file").setInputFiles(exportedPath!);
  await page.getByRole("button", { name: "Import CSV" }).click();
  await expect(
    page.getByRole("status", { name: "Import complete" }),
  ).toContainText(
    "Imported 1 expense, 1 income source, 0 expense categories, and 0 income categories.",
  );

  const malformed =
    "Record Type,Record ID,Name / Description,Amount,Date,End Date,Frequency,Interval,Days of Month,Category,Category ID,Created At\n" +
    "Expense Category,rollback-category,Should Roll Back,,,,,,,,,2026-01-01T00:00:00Z\n" +
    "Unknown,broken,row,,,,,,,,,2026-01-01T00:00:00Z\n";
  await page.getByLabel("SpendWise CSV file").setInputFiles({
    name: "malformed.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(malformed),
  });
  await page.getByRole("button", { name: "Import CSV" }).click();
  await expect(
    page.getByRole("alert", { name: "Import failed" }),
  ).toContainText(/unknown Record Type/i);
  await page.goto("/categories");
  await expect(page.getByLabel("Rename Should Roll Back")).toHaveCount(0);
});
