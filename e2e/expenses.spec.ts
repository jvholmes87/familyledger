import { test, expect, type Page } from "@playwright/test";

/**
 * FR2 — Expense CRUD, exercised end-to-end against live Supabase.
 * Each test signs up a fresh user so data starts empty and isolated.
 */

async function signUp(page: Page) {
  const email = `exp+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/login");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("user can add, edit, and delete an expense with a category", async ({
  page,
}) => {
  await signUp(page);
  // "Groceries" is one of the default categories every new user gets.

  // Go to expenses from the dashboard nav.
  await page.goto("/dashboard");
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Expenses", exact: true })
    .click();
  await expect(page).toHaveURL(/\/expenses$/);
  await expect(page.getByText(/no expenses yet/i)).toBeVisible();

  // Add.
  await page.getByLabel("Amount").fill("42.50");
  await page.getByLabel("Date").fill("2026-07-01");
  await page.getByLabel("Category").selectOption({ label: "Groceries" });
  await page.getByLabel("Description").fill("weekly shop");
  await page.getByRole("button", { name: "Add expense" }).click();

  const row = page.getByRole("listitem").filter({ hasText: "weekly shop" });
  await expect(row).toContainText("$42.50");
  await expect(row).toContainText("Groceries");

  // Edit the amount.
  await row.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/expenses\/.+\/edit$/);
  await expect(page.getByLabel("Amount")).toHaveValue("42.5");
  await page.getByLabel("Amount").fill("50.00");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page).toHaveURL(/\/expenses$/);
  await expect(
    page.getByRole("listitem").filter({ hasText: "weekly shop" }),
  ).toContainText("$50.00");

  // Delete.
  await page
    .getByRole("listitem")
    .filter({ hasText: "weekly shop" })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByText(/no expenses yet/i)).toBeVisible();
});

test("rejects a negative amount", async ({ page }) => {
  await signUp(page);
  await page.goto("/expenses");

  await page.getByLabel("Amount").fill("-5");
  await page.getByLabel("Date").fill("2026-07-01");
  // Bypass the browser's native min validation to reach the server validator.
  await page.getByLabel("Amount").evaluate((el: HTMLInputElement) => {
    el.removeAttribute("min");
  });
  await page.getByRole("button", { name: "Add expense" }).click();

  await expect(page.getByText(/zero or greater/i)).toBeVisible();
});
