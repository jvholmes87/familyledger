import { test, expect, type Page } from "@playwright/test";

/**
 * FR3 — Category management, exercised end-to-end against live Supabase.
 * Income and expense categories are managed together on /categories, and every
 * new user starts with a set of default categories.
 */

async function signUp(page: Page) {
  const email = `cat+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/login");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

const expenseSection = (page: Page) =>
  page.getByRole("region", { name: "Expense categories" });
const incomeSection = (page: Page) =>
  page.getByRole("region", { name: "Income categories" });

test("new users start with default income and expense categories", async ({
  page,
}) => {
  await signUp(page);
  await page.getByRole("link", { name: "Categories", exact: true }).click();
  await expect(page).toHaveURL(/\/categories$/);

  // Representative defaults from each section.
  await expect(expenseSection(page).getByLabel("Rename Groceries")).toHaveValue(
    "Groceries",
  );
  await expect(expenseSection(page).getByLabel("Rename Housing")).toHaveValue(
    "Housing",
  );
  await expect(incomeSection(page).getByLabel("Rename Salary")).toHaveValue(
    "Salary",
  );
  await expect(incomeSection(page).getByLabel("Rename Benefits")).toHaveValue(
    "Benefits",
  );
});

test("user can create, rename, and delete an expense category", async ({
  page,
}) => {
  await signUp(page);
  await page.getByRole("link", { name: "Categories", exact: true }).click();
  await expect(page).toHaveURL(/\/categories$/);

  const section = expenseSection(page);

  // Create a custom (non-default) category.
  await section.getByLabel("Category name").fill("Coffee Runs");
  await section.getByRole("button", { name: "Add category" }).click();
  await expect(section.getByLabel("Rename Coffee Runs")).toHaveValue(
    "Coffee Runs",
  );

  // Rename.
  await section.getByLabel("Rename Coffee Runs").fill("Espresso");
  await section.getByRole("button", { name: "Rename Coffee Runs" }).click();
  await expect(section.getByLabel("Rename Espresso")).toHaveValue("Espresso");

  // Delete.
  await section.getByRole("button", { name: "Delete Espresso" }).click();
  await expect(section.getByLabel("Rename Espresso")).toHaveCount(0);
});

test("user can create an income category", async ({ page }) => {
  await signUp(page);
  await page.goto("/categories");

  const section = incomeSection(page);
  await section.getByLabel("Income category name").fill("Rental Income");
  await section.getByRole("button", { name: "Add category" }).click();
  await expect(section.getByLabel("Rename Rental Income")).toHaveValue(
    "Rental Income",
  );
});

test("rejects a duplicate category name", async ({ page }) => {
  await signUp(page);
  await page.goto("/categories");

  const section = expenseSection(page);
  // "Housing" is a default, so re-adding it is a duplicate.
  await section.getByLabel("Category name").fill("Housing");
  await section.getByRole("button", { name: "Add category" }).click();
  await expect(section.getByRole("alert")).toContainText(/already exists/i);
});
