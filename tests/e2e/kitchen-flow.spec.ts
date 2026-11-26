import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("home opens recipe collection and search filters results", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /chef rumahan/i })).toBeVisible();
  await page.getByRole("button", { name: /jelajahi resep/i }).click();

  await expect(page.getByRole("heading", { name: "Temukan resep" })).toBeVisible();
  const search = page.getByPlaceholder("Cari nama resep...");
  await search.fill("Soto Ayam");

  await expect(page.getByText("1 resep ditemukan")).toBeVisible();
  await expect(page.getByRole("button", { name: /Soto Ayam Lamongan/i })).toBeVisible();
});

test("recipe detail starts cooking mode and advances a step", async ({ page }) => {
  await page.getByRole("button", { name: /jelajahi resep/i }).click();
  await page.getByPlaceholder("Cari nama resep...").fill("Nasi Goreng Kampung");
  await page.getByRole("button", { name: /Nasi Goreng Kampung/i }).click();

  await expect(page.getByRole("heading", { name: "Nasi Goreng Kampung" })).toBeVisible();
  await page.getByRole("button", { name: /Mulai memasak/i }).click();
  await expect(page.getByText(/LANGKAH 1 \/ 6/i)).toBeVisible();
  await page.getByRole("button", { name: /Langkah berikutnya/i }).click();
  await expect(page.getByText(/LANGKAH 2 \/ 6/i)).toBeVisible();
});

test("directional keys move focus between remote controls", async ({ page }) => {
  await page.waitForTimeout(100);
  const initialFocus = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.textContent?.trim());
  await page.keyboard.press("ArrowDown");
  const nextFocus = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.textContent?.trim());

  expect(nextFocus).not.toBe(initialFocus);
  await expect(page.locator(":focus-visible")).toHaveCount(1);
});
