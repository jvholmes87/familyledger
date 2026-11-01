import { test, expect } from "@playwright/test";

test("redirects unauthenticated users from a protected route to login", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("tab", { name: "Sign in" })).toBeVisible();
});

test("shows a validation error for an invalid password", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("someone@example.com");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

// Full happy path. Requires the Supabase project to auto-confirm emails
// (Authentication → Email → "Confirm email" off) so sign-up creates a session.
test("user can sign up, reach the dashboard, and sign out", async ({
  page,
}) => {
  const email = `e2e+${Date.now()}@example.com`;
  const password = "test-password-123";

  await page.goto("/login");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

  await page.getByRole("button", { name: `Account menu for ${email}` }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
