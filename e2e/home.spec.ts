import { expect, test } from "@playwright/test";

test("shows the playground home page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Talking Dev Playground" })).toBeVisible();
});
