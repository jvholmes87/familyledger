import { test, expect, type Page } from "@playwright/test";

async function signUp(page: Page) {
  const email = `settings+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/login");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
}

test("account menu leads to Settings data export and keeps sign out available", async ({
  page,
}) => {
  const email = await signUp(page);
  const accountMenu = page.getByRole("button", {
    name: `Account menu for ${email}`,
  });

  await expect(page.getByRole("link", { name: "Export CSV" })).toHaveCount(0);
  await accountMenu.hover();

  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveCount(2);
  await expect(menu.getByRole("menuitem", { name: "Settings" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Sign out" })).toBeVisible();

  await page.evaluate(() => {
    document.body.style.minHeight = "200vh";
  });
  await page.mouse.wheel(0, 500);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);

  await menu.getByRole("menuitem", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Export CSV" })).toHaveAttribute(
    "href",
    "/export",
  );

  await accountMenu.click();
  await expect(
    page.getByRole("menuitem", { name: "Settings" }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
