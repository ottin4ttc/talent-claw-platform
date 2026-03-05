import { test, expect } from "@playwright/test";

test("dashboard flow", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[placeholder="Phone"]', "13800138000");
  await page.click('button:has-text("Send Code")');
  await page.fill('input[placeholder="Code"]', "123456");
  await page.click('button:has-text("Sign in")');

  await expect(page.getByText("Balance")).toBeVisible();
  await page.click('button:has-text("API Keys")');
  await expect(page.getByText("Create API Key")).toBeVisible();
});
