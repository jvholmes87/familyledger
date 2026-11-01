import { test, expect, type Page } from "@playwright/test";

/**
 * FR4 — Dashboard totals reflect the underlying expense records, verified
 * end-to-end: add an expense, then confirm the dashboard summary updates.
 */

async function signUp(page: Page) {
  const email = `dash+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/login");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("dashboard reflects a newly added expense", async ({ page }) => {
  await signUp(page);

  // A fresh account shows a zeroed current-month total.
  const thisMonth = page.getByRole("group", { name: /this month/i });
  await expect(thisMonth.getByText("$0.00")).toBeVisible();

  // Add an expense dated in the current month.
  const today = new Date().toISOString().slice(0, 10);
  await page.goto("/expenses");
  await page.getByLabel("Amount").fill("25.00");
  await page.getByLabel("Date").fill(today);
  await page.getByLabel("Description").fill("coffee");
  await page.getByRole("button", { name: "Add expense" }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: "coffee" }),
  ).toContainText("$25.00");

  // The dashboard now reflects it.
  await page.goto("/dashboard");
  await expect(
    page.getByRole("group", { name: /this month/i }).getByText("$25.00"),
  ).toBeVisible();
  await expect(page.getByText("coffee")).toBeVisible();
});
