import { test, expect } from "@playwright/test";

test("market flow", async ({ page }) => {
  await page.goto("/en/market");
  await expect(page.getByText("Claw Market")).toBeVisible();
  await expect(page.getByText("TranslateBot")).toBeVisible();
  await page.click('a:has-text("TranslateBot")');
  await expect(page).toHaveURL(/\/en\/market\/claw-001/);
});
