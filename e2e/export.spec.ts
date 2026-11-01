import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";

async function signUp(page: Page) {
  const email = `export+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/login");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("user can download all expense, income, and category data in one CSV", async ({
  page,
}) => {
  await signUp(page);

  await page.goto("/expenses");
  await page.getByLabel("Amount").fill("42.50");
  await page.getByLabel("Date").fill("2026-07-01");
  await page.getByLabel("Category").selectOption({ label: "Groceries" });
  await page.getByLabel("Description").fill("Export test shop");
  await page.getByRole("button", { name: "Add expense" }).click();
  await expect(page.getByText("Export test shop")).toBeVisible();

  await page.goto("/income");
  await page.getByLabel("Name").fill("Export test income");
  await page.getByLabel("Amount").fill("1234.56");
  await page.getByLabel("Frequency").selectOption("one_time");
  await page.getByLabel("Start date").fill("2026-07-02");
  await page.getByRole("button", { name: "Add income" }).click();
  await expect(page.getByText("Export test income")).toBeVisible();

  await page.goto("/settings");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Export CSV" }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(
    /^spendwise-data-\d{4}-\d{2}-\d{2}\.csv$/,
  );
  const path = await download.path();
  expect(path).not.toBeNull();
  const csv = await readFile(path!, "utf8");

  expect(csv).toContain("Record Type,Record ID,Name / Description,Amount");
  expect(csv).toContain("Expense,");
  expect(csv).toContain("Export test shop,42.5,2026-07-01");
  expect(csv).toContain("Income Source,");
  expect(csv).toContain("Export test income,1234.56,2026-07-02");
  expect(csv).toContain("Expense Category,");
  expect(csv).toContain("Groceries");
});
