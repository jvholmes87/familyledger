// Capture feature screenshots against a running local dev server seeded with
// the demo user (see scripts/seed-demo.mjs). Not part of CI — a helper for PRs.
//
// Usage: node scripts/capture-screenshots.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.SEED_EMAIL ?? "demo@example.com";
const PASSWORD = process.env.SEED_PASSWORD ?? "demo-password-123";
const OUT = "docs/screenshots/income";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

await page.goto(`${BASE}/login`);
await page.getByLabel("Email").fill(EMAIL);
await page.getByLabel("Password").fill(PASSWORD);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/\/dashboard$/);

await page.goto(`${BASE}/dashboard`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/dashboard-balance.png`, fullPage: true });

await page.goto(`${BASE}/income`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/income-tab.png`, fullPage: true });

// Open the twice-a-month source to show the frequency editor + live preview.
const row = page
  .getByRole("listitem")
  .filter({ has: page.getByRole("button", { name: /Delete/ }) })
  .filter({ hasText: "Direct deposit" });
await row.getByRole("link", { name: "Edit" }).click();
await page.waitForURL(/\/income\/.+\/edit$/);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);
await page.screenshot({
  path: `${OUT}/income-frequency-editor.png`,
  fullPage: true,
});

await page.goto(`${BASE}/categories`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/categories.png`, fullPage: true });

await browser.close();
console.log(`Saved screenshots to ${OUT}/`);
