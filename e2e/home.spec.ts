import { expect, test } from "@playwright/test";

test("shows registered namespaces on the welcome page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Registered experiments" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Welcome/ })).toHaveAttribute("href", "/welcome");
});
