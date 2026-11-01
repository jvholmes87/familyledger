import { test, expect, type Page } from "@playwright/test";

/**
 * Responsive guard: the new screens must not overflow horizontally on a small
 * phone viewport, and the shared header nav must be present on every protected
 * page. Catches layout regressions (a wide row, an unwrapped header) that unit
 * tests can't see.
 */

const MOBILE = { width: 375, height: 780 };
const VIEWPORTS = [
  MOBILE,
  { width: 768, height: 900 },
  { width: 1440, height: 1000 },
] as const;

async function signUp(page: Page) {
  const email = `resp+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  await page.goto("/login");
  await page.getByRole("tab", { name: "Sign up" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("test-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, "page overflows horizontally").toBeLessThanOrEqual(1);
}

async function expectMinimumTouchHeight(
  locator: ReturnType<Page["getByRole"]>,
) {
  const box = await locator.boundingBox();
  expect(box, "touch target should have a rendered box").not.toBeNull();
  expect(
    box?.height,
    "touch target should be at least 44px tall",
  ).toBeGreaterThanOrEqual(44);
}

test("primary public controls provide full-size phone touch targets", async ({
  page,
}) => {
  await page.setViewportSize(MOBILE);

  await page.goto("/");
  await expectMinimumTouchHeight(
    page.locator("header").getByRole("link", { name: "Sign in" }),
  );

  await page.goto("/login");
  await expectMinimumTouchHeight(page.getByRole("tab", { name: "Sign in" }));
  await expectMinimumTouchHeight(page.getByRole("tab", { name: "Sign up" }));
});

test("protected primary controls provide full-size phone touch targets", async ({
  page,
}) => {
  await page.setViewportSize(MOBILE);
  await signUp(page);

  const header = page.getByRole("banner");
  await expectMinimumTouchHeight(
    header.getByRole("link", { name: "SpendWise" }),
  );
  await expectMinimumTouchHeight(
    header.getByRole("button", { name: /Account menu for/ }),
  );
  await expect(header.locator(".lucide-menu")).toBeVisible();
  await expect(header.getByText("Signed in")).toBeHidden();

  const navigation = header.getByRole("navigation", {
    name: "Primary navigation",
  });
  for (const label of ["Dashboard", "Expenses", "Categories"]) {
    await expectMinimumTouchHeight(
      navigation.getByRole("link", { name: label }),
    );
  }

  await page.goto("/expenses");
  await expectMinimumTouchHeight(
    page.getByRole("button", { name: "Add expense" }),
  );

  await page.getByLabel("Amount").fill("1.00");
  await page.getByLabel("Date").fill("2026-07-11");
  await page.getByLabel("Description").fill("Touch target audit");
  await page.getByRole("button", { name: "Add expense" }).click();

  const row = page
    .getByRole("listitem")
    .filter({ hasText: "Touch target audit" });
  await expect(row).toBeVisible();
  await expectMinimumTouchHeight(
    row.getByRole("link", {
      name: "Edit entry 1: Touch target audit, 2026-07-11, $1.00",
    }),
  );
  await expectMinimumTouchHeight(
    row.getByRole("button", {
      name: "Delete entry 1: Touch target audit, 2026-07-11, $1.00",
    }),
  );
});

test("key screens fit a small phone viewport without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize(MOBILE);

  await page.goto("/login");
  await expectNoHorizontalOverflow(page);

  await signUp(page);

  // Seed a category and an expense with a long description (worst case for the
  // list row) so the populated states are exercised, not just empty ones.
  await page.goto("/categories");
  const categorySection = page.getByRole("region", {
    name: "Expense categories",
  });

  const longCategory = "C".repeat(60);
  await categorySection.getByLabel("Category name").fill(longCategory);
  await categorySection.getByRole("button", { name: "Add category" }).click();
  await expect(
    categorySection.getByLabel(`Rename ${longCategory}`),
  ).toHaveValue(longCategory);
  await expectNoHorizontalOverflow(page);

  await page.goto("/expenses");
  await page.getByLabel("Amount").fill("1234.56");
  await page.getByLabel("Date").fill("2026-07-05");
  await page.getByLabel("Category").selectOption({ label: longCategory });
  await page
    .getByLabel("Description")
    .fill("a deliberately long expense description to stress the row layout");
  await page.getByRole("button", { name: "Add expense" }).click();
  const longExpenseRow = page
    .getByRole("listitem")
    .filter({ hasText: "deliberately long" });
  await expect(longExpenseRow).toBeVisible();
  await expect(
    longExpenseRow.getByText(longCategory, { exact: true }),
  ).toBeVisible();

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);

    for (const path of ["/categories", "/expenses", "/dashboard"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  }
});

test("every protected page shows the shared header nav", async ({ page }) => {
  const email = await signUp(page);
  await page.setViewportSize({ width: 768, height: 900 });

  for (const path of ["/dashboard", "/expenses", "/categories", "/settings"]) {
    await page.goto(path);
    await expect(page.getByRole("link", { name: "SpendWise" })).toBeVisible();
    const navigation = page.getByRole("navigation", {
      name: "Primary navigation",
    });
    await expect(
      navigation.getByRole("link", { name: "Dashboard", exact: true }),
    ).toBeVisible();
    await expect(
      navigation.getByRole("link", { name: "Expenses", exact: true }),
    ).toBeVisible();
    await expect(
      navigation.getByRole("link", { name: "Categories", exact: true }),
    ).toBeVisible();
    const accountMenu = page.getByRole("button", {
      name: `Account menu for ${email}`,
    });
    await expect(accountMenu).toBeVisible();
    await accountMenu.click();
    await expect(
      page.getByRole("menuitem", { name: "Sign out" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  }
});
