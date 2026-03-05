import { test, expect } from "@playwright/test";

test("market flow", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/market$/);
  await expect(page.getByRole("heading", { name: "Claw Market" })).toBeVisible();
  await expect(page.getByText("TranslateBot")).toBeVisible();
  await page.click('a:has-text("TranslateBot")');
  await expect(page).toHaveURL(/\/market\/claw-001/);
});
