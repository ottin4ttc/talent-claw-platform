import { test, expect } from "@playwright/test";

test("transactions flow", async ({ page }) => {
  await page.goto("/en/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[placeholder="Phone"]', "13800138000");
  await page.click('button:has-text("Send Code")');
  await page.fill('input[placeholder="Code"]', "123456");
  await page.click('button:has-text("Sign in")');

  await page.goto("/en/transactions");
  await expect(page.getByText("Transaction History")).toBeVisible();
  await page.selectOption("select", "escrow_hold");
  await expect(
    page.getByRole("cell", { name: "Escrow Hold", exact: true }).first()
  ).toBeVisible();
});
