import { test, expect, type Browser, type Page } from "@playwright/test";

/**
 * FR5 — Data isolation across the application's real surfaces.
 *
 * #4 proves isolation at the database layer via direct queries. This test
 * drives the actual app: two users in separate browser contexts, and asserts
 * that user B never sees user A's data through the expenses list, the
 * categories page, the dashboard totals, or by navigating directly to user
 * A's expense edit route. If any surface stopped scoping to the signed-in
 * user, one of these assertions would fail.
 */

async function signUpFreshUser(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `iso-ui+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/login");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return page;
}

test("user B cannot see user A's data through any app surface", async ({
  browser,
}) => {
  // --- User A creates a category and an expense, and we capture its edit URL.
  const a = await signUpFreshUser(browser);

  await a.goto("/categories");
  const aExpenseCategories = a.getByRole("region", {
    name: "Expense categories",
  });
  await aExpenseCategories
    .getByLabel("Category name")
    .fill("A-Secret-Category");
  await aExpenseCategories
    .getByRole("button", { name: "Add category" })
    .click();
  await expect(
    aExpenseCategories.getByLabel("Rename A-Secret-Category"),
  ).toHaveValue("A-Secret-Category");

  await a.goto("/expenses");
  await a.getByLabel("Amount").fill("123.45");
  await a.getByLabel("Date").fill(new Date().toISOString().slice(0, 10));
  await a.getByLabel("Category").selectOption({ label: "A-Secret-Category" });
  await a.getByLabel("Description").fill("A-Secret-Expense");
  await a.getByRole("button", { name: "Add expense" }).click();

  const aRow = a.getByRole("listitem").filter({ hasText: "A-Secret-Expense" });
  await expect(aRow).toContainText("$123.45");
  const aEditUrl = await aRow
    .getByRole("link", { name: "Edit" })
    .getAttribute("href");
  expect(aEditUrl).toMatch(/\/expenses\/.+\/edit$/);

  // --- User B, in a separate context, sees none of it.
  const b = await signUpFreshUser(browser);

  await b.goto("/expenses");
  await expect(b.getByText(/no expenses yet/i)).toBeVisible();
  await expect(b.getByText("A-Secret-Expense")).toHaveCount(0);

  // User B has their own default categories, but never user A's custom one.
  await b.goto("/categories");
  await expect(b.getByText("A-Secret-Category")).toHaveCount(0);

  await b.goto("/dashboard");
  await expect(
    b.getByRole("group", { name: /this month/i }).getByText("$0.00"),
  ).toBeVisible();
  await expect(b.getByText("A-Secret-Expense")).toHaveCount(0);

  // Navigating directly to user A's expense edit route is denied (RLS returns
  // nothing -> the route renders not-found rather than leaking the record).
  const editResponse = await b.goto(aEditUrl!);
  expect(editResponse?.status()).toBe(404);
  await expect(b.getByLabel("Amount")).toHaveCount(0);
  await expect(b.getByText("$123.45")).toHaveCount(0);

  await a.context().close();
  await b.context().close();
});
