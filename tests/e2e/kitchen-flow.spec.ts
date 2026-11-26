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

test("Backspace edits the search field instead of leaving the page", async ({ page }) => {
  await page.getByRole("button", { name: /jelajahi resep/i }).click();
  const search = page.getByPlaceholder("Cari nama resep...");
  await search.fill("Soto Ayam");
  await search.focus();
  await page.keyboard.press("Backspace");

  await expect(page.getByRole("heading", { name: "Temukan resep" })).toBeVisible();
  await expect(search).toHaveValue("Soto Aya");
});

test("remote focus stays inside the remote help dialog", async ({ page }) => {
  await page.getByRole("button", { name: "Bantuan remote" }).click();
  const dialog = page.getByRole("dialog", { name: "Kontrol remote" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("ArrowDown");

  await expect.poll(() => page.evaluate(() => {
    return document.activeElement?.closest('[role="dialog"][aria-modal="true"]') !== null;
  })).toBe(true);
});

test("remote help receives focus and restores it when closed", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Bantuan remote" });
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Kontrol remote" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("recipe can be saved and found in favorites", async ({ page }) => {
  await page.getByRole("button", { name: /Jelajahi resep/i }).click();
  await page.getByPlaceholder("Cari nama resep...").fill("Nasi Goreng Kampung");
  await page.getByRole("button", { name: /Nasi Goreng Kampung/i }).click();
  await page.getByRole("button", { name: /Simpan ke favorit/i }).click();
  await page.locator("aside nav").getByRole("button", { name: "Favorit" }).click();

  await expect(page.getByRole("button", { name: /Nasi Goreng Kampung/i })).toBeVisible();
});

test("timer can be started and paused", async ({ page }) => {
  await page.getByRole("button", { name: "Timer" }).click();
  await page.getByLabel("Durasi menit dan detik").fill("01:00");
  await page.getByRole("button", { name: "Mulai timer" }).click();
  await expect(page.getByText("Timer sedang berjalan")).toBeVisible();
  await page.getByRole("button", { name: /Jeda/i }).click();
  await expect(page.getByText("Timer dijeda")).toBeVisible();
});

for (const viewport of [{ width: 1920, height: 1080 }, { width: 1280, height: 720 }]) {
  test(`main layout has no horizontal page overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
