import { test, expect, type Page } from "@playwright/test";

/**
 * Income feature, exercised end-to-end against live Supabase. Each test signs
 * up a fresh user so data starts empty and isolated (FR5).
 */

async function signUp(page: Page) {
  const email = `inc+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/login");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/**
 * A row in the income register (not the donut legend). Register rows uniquely
 * contain a Delete button, which disambiguates them from the "income mix"
 * chart's list items that share the same category name.
 */
function registerRow(page: Page, name: string) {
  return page
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: /Delete/ }) })
    .filter({ hasText: name });
}

async function createIncomeCategory(page: Page, name: string) {
  await page.goto("/categories");
  const section = page.getByRole("region", { name: "Income categories" });
  await section.getByLabel("Income category name").fill(name);
  await section.getByRole("button", { name: "Add category" }).click();
  await expect(section.getByLabel(`Rename ${name}`)).toHaveValue(name);
}

test("user can add a recurring income source and see it counted on the dashboard", async ({
  page,
}) => {
  await signUp(page);
  await createIncomeCategory(page, "VA Disability");

  // Navigate to Income from the nav.
  await page.goto("/dashboard");
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Income", exact: true })
    .click();
  await expect(page).toHaveURL(/\/income$/);
  await expect(page.getByText(/no income yet/i)).toBeVisible();

  // Add a monthly recurring source.
  await page.getByLabel("Name").fill("VA Disability");
  await page.getByLabel("Amount").fill("3737.85");
  await page.getByLabel("Category").selectOption({ label: "VA Disability" });
  await page.getByLabel("Frequency").selectOption("every_month");
  await page.getByLabel("Start date").fill("2026-01-01");

  // The live preview reflects the schedule before saving.
  const preview = page.getByRole("region", { name: /preview/i });
  await expect(preview).toContainText(/repeats every month/i);

  await page.getByRole("button", { name: "Add income" }).click();

  const row = registerRow(page, "VA Disability");
  await expect(row).toContainText("$3,737.85");
  await expect(row).toContainText(/every month/i);

  // The dashboard balance panel counts it (income > 0, surplus "Over").
  await page.goto("/dashboard");
  const balance = page.getByRole("region", { name: /income vs\.? expenses/i });
  await expect(balance).toContainText("$3,737.85");
  await expect(balance).toContainText("Over");
});

test("user can add a twice-a-month source with a live occurrence preview", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/income");

  const previewStart = new Date();
  previewStart.setUTCMonth(previewStart.getUTCMonth() + 1, 15);
  const previewLast = new Date(
    Date.UTC(previewStart.getUTCFullYear(), previewStart.getUTCMonth() + 1, 0),
  );
  const isoStart = previewStart.toISOString().slice(0, 10);
  const formatPreviewDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);

  await page.getByLabel("Name").fill("Paycheck");
  await page.getByLabel("Amount").fill("980");
  await page.getByLabel("Frequency").selectOption("twice_a_month");

  // Pick the 15th and the last day of the month.
  await page.getByRole("button", { name: "15th", exact: true }).click();
  await page.getByRole("button", { name: "Last", exact: true }).click();
  // Keep the preview fixture in the near future so this remains stable as time passes.
  await page.getByLabel("Start date").fill(isoStart);

  const preview = page.getByRole("region", { name: /preview/i });
  await expect(preview).toContainText(/15th and last/i);
  await expect(preview).toContainText(formatPreviewDate(previewStart));
  await expect(preview).toContainText(formatPreviewDate(previewLast));

  await page.getByRole("button", { name: "Add income" }).click();

  const row = registerRow(page, "Paycheck");
  await expect(row).toContainText("$980.00");
  await expect(row).toContainText(/twice a month/i);
});

test("user can edit and delete an income source", async ({ page }) => {
  await signUp(page);
  await page.goto("/income");

  await page.getByLabel("Name").fill("Freelance");
  await page.getByLabel("Amount").fill("500");
  await page.getByLabel("Frequency").selectOption("one_time");
  await page.getByLabel("Start date").fill("2026-07-10");
  await page.getByRole("button", { name: "Add income" }).click();

  const row = registerRow(page, "Freelance");
  await expect(row).toContainText("$500.00");

  // Edit the amount.
  await row.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/income\/.+\/edit$/);
  await expect(page.getByLabel("Amount")).toHaveValue("500");
  await page.getByLabel("Amount").fill("650");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page).toHaveURL(/\/income$/);
  await expect(registerRow(page, "Freelance")).toContainText("$650.00");

  // Delete.
  await registerRow(page, "Freelance")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByText(/no income yet/i)).toBeVisible();
});
