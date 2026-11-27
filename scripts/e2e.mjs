/**
 * Kitchen OS end-to-end remote-control test.
 * Drives a real Chrome using ONLY keyboard events (Arrow keys, Enter, Escape,
 * Backspace, MediaPlayPause) — the same events an Android TV D-pad produces.
 *
 *   npm run build && npm run test:e2e
 *   CHROME_PATH=/path/to/chrome npm run test:e2e
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const PORT = Number(process.env.E2E_PORT || 3100);
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const SHOTS = "test-results";
mkdirSync(SHOTS, { recursive: true });

let failures = 0;
let passes = 0;
const consoleErrors = [];
const log = (ok, name, extra = "") => {
  if (ok) passes++;
  else failures++;
  console.log(`${ok ? "✔" : "✘"} ${name}${extra ? ` — ${extra}` : ""}`);
};

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT), "-H", "127.0.0.1"], { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ANTHROPIC_API_KEY: "" } });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("server start timeout")), 60_000);
  server.stderr.on("data", (d) => process.stderr.write(d));
  server.stdout.on("data", (d) => {
    if (/Ready|started|Local:/i.test(String(d))) {
      clearTimeout(t);
      resolve();
    }
  });
});

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });

async function run(width, height) {
  console.log(`\n=== ${width}×${height} ===`);
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" && !/youtube|ytimg|ERR_|net::|Failed to load resource/i.test(m.text())) consoleErrors.push(`[${width}] ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`[${width}] pageerror: ${e.message}`));

  const fk = () => page.evaluate(() => document.activeElement?.getAttribute("data-focus-key") ?? document.activeElement?.tagName);
  const press = async (key, n = 1) => {
    for (let i = 0; i < n; i++) {
      await page.keyboard.press(key);
      await page.waitForTimeout(90);
    }
  };
  const pressUntil = async (key, target, max = 25) => {
    for (let i = 0; i < max; i++) {
      if ((await fk()) === target) return true;
      await press(key);
    }
    return (await fk()) === target;
  };
  const waitFocus = async (target, ms = 4000) => {
    try {
      await page.waitForFunction((t) => document.activeElement?.getAttribute("data-focus-key") === t, target, { timeout: ms });
      return true;
    } catch {
      return false;
    }
  };
  const noOverflow = () =>
    page.evaluate(() => {
      const main = document.querySelector("main");
      const docOk = document.documentElement.scrollWidth <= window.innerWidth + 1;
      const mainOk = !main || main.scrollWidth <= main.clientWidth + 1;
      return docOk && mainOk;
    });
  const shot = (name) => page.screenshot({ path: `${SHOTS}/${width}x${height}-${name}.png` });

  // --- Home ---
  await page.goto(BASE + "/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  log(await waitFocus("hero-start"), "Home: initial focus on Start Cooking", await fk());
  log(await noOverflow(), "Home: no horizontal overflow");
  await shot("home");

  // Sidebar navigation
  await press("ArrowLeft");
  const sideKey = await fk();
  log(sideKey === "nav-/", "D-pad Left enters sidebar on the active item", sideKey);
  await press("ArrowDown");
  log((await fk()) === "nav-/recipes", "Sidebar: Down moves to Recipes");
  await press("Enter");
  await page.waitForURL("**/recipes");
  log(await waitFocus("recipe-nasi-goreng"), "Recipes: Enter navigates, focus lands on first card", await fk());
  log(await noOverflow(), "Recipes: no horizontal overflow");
  await shot("recipes");

  // Grid navigation
  await press("ArrowRight");
  const second = await fk();
  log(second === "recipe-soto-ayam", "Recipes grid: Right moves to next card", second);
  await press("ArrowLeft");
  await press("Enter");
  await page.waitForURL("**/recipes/nasi-goreng");
  log(await waitFocus("detail-start"), "Recipe detail opens with Start Cooking focused", await fk());
  await shot("detail");

  // Servings 2 → 3 scales 400 g rice → 600 g
  log(await pressUntil("ArrowRight", "detail-servings-inc"), "Reach servings + with the D-pad");
  await press("Enter");
  const rice = await page.evaluate(() => [...document.querySelectorAll("li")].find((li) => li.textContent?.includes("jasmine rice"))?.textContent);
  log(/600\s*g/.test(rice ?? ""), "Servings 2→3 scales rice 400 g → 600 g", rice?.replace(/\s+/g, " "));
  await press("ArrowLeft", 1);
  await pressUntil("ArrowLeft", "detail-start");
  await press("Enter");
  await page.waitForURL("**/cooking/nasi-goreng");
  log(await waitFocus("cook-next"), "Cooking Mode opens with Next focused", await fk());
  log(await noOverflow(), "Cooking Mode: no horizontal overflow");
  await press("Enter");
  await page.waitForTimeout(200);
  const step2 = await page.textContent("main");
  log(/Step\s*2\s*of\s*6/.test(step2 ?? ""), "Next advances to step 2");
  await shot("cooking");

  // Persistence across reload
  await page.reload();
  await page.waitForTimeout(600);
  log(/Step\s*2\s*of\s*6/.test((await page.textContent("main")) ?? ""), "Cooking progress survives a page reload");

  // Accidental exit protection
  await waitFocus("cook-next");
  await press("Escape");
  log(await waitFocus("exit-stay"), "Back/Escape opens the exit confirmation", await fk());
  await press("ArrowRight");
  await press("ArrowRight");
  log((await fk()) === "exit-leave", "Focus is trapped in the dialog", await fk());
  await press("Escape");
  await page.waitForTimeout(150);
  log((await page.locator("[data-focus-scope=modal]").count()) === 0 && (await fk()) === "cook-next", "Escape closes dialog and restores focus", await fk());

  // Hardware Back (history.back) is intercepted while cooking
  await page.evaluate(() => history.back());
  await page.waitForTimeout(400);
  log(page.url().endsWith("/cooking/nasi-goreng") && (await page.locator("[data-focus-scope=modal]").count()) === 1, "Hardware Back (history.back) asks before leaving", page.url());
  await page.evaluate(() => history.back());
  await page.waitForTimeout(400);
  log((await page.locator("[data-focus-scope=modal]").count()) === 0 && page.url().endsWith("/cooking/nasi-goreng"), "Hardware Back closes the dialog without leaving");

  // Step timer from instruction (step 2 has 3 min)
  await waitFocus("cook-next");
  await pressUntil("ArrowUp", "cook-timer-toggle", 4);
  if ((await fk()) !== "cook-timer-toggle") await pressUntil("ArrowRight", "cook-timer-toggle", 4);
  await press("Enter");
  await page.waitForTimeout(1300);
  const timers = await page.evaluate(() => JSON.parse(localStorage.getItem("kos:v1:timers") || "[]"));
  log(timers.length === 1 && timers[0].status === "running", "Step timer created from the instruction", `${timers.length} timer(s)`);

  // MediaPlayPause pauses cooking
  await press("MediaPlayPause");
  await page.waitForTimeout(200);
  log(/Paused/.test((await page.textContent("header")) ?? ""), "MediaPlayPause pauses Cooking Mode");
  await press("MediaPlayPause");

  // Finish all steps
  await page.locator('[data-focus-key="cook-next"]').focus();
  for (let i = 0; i < 8; i++) {
    if (/Enjoy your meal/.test((await page.textContent("body")) ?? "")) break;
    await press("Enter");
    await page.waitForTimeout(120);
  }
  log(/Enjoy your meal/.test((await page.textContent("body")) ?? ""), "Completion screen after the last step");
  log(await waitFocus("done-home"), "Completion: Home button focused");
  await shot("complete");

  // --- Timers: multiple, survive navigation, alarm ---
  await page.goto(BASE + "/timer");
  await page.evaluate(() => {
    const now = Date.now();
    const mk = (id, label, ms, endsIn) => ({ id, label, durationMs: ms, status: "running", endsAt: now + endsIn, remainingMs: ms, createdAt: now, finishedAt: null, acknowledged: false });
    localStorage.setItem("kos:v1:timers", JSON.stringify([mk("a", "Boil eggs", 480000, 480000), mk("b", "Fry chicken", 720000, 720000), mk("c", "Quick test", 3000, 2500)]));
  });
  await page.reload();
  await page.waitForTimeout(500);
  log((await page.locator("article").count()) === 3, "Timer page shows 3 simultaneous timers");
  await shot("timers");
  log(await waitFocus("alarm-stop", 6000), "Alarm dialog appears when a timer ends, Stop focused", await fk());
  await shot("alarm");
  await press("Enter");
  await page.waitForTimeout(200);
  log((await page.locator("[data-focus-scope=modal]").count()) === 0, "OK on the remote stops the alarm");
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("kos:v1:timers")).find((t) => t.id === "a").endsAt);
  await page.goto(BASE + "/recipes");
  await page.goto(BASE + "/timer");
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("kos:v1:timers")).find((t) => t.id === "a"));
  log(after.status === "running" && after.endsAt === before, "Timers survive route navigation (same end time)");

  // Create a timer with the remote
  await waitFocus("timer-new", 2000);
  await page.locator('[data-focus-key="timer-new"]').focus();
  await press("Enter");
  log(await waitFocus("preset-0"), "New timer dialog focuses first preset");
  await press("Enter");
  for (let i = 0; i < 12 && !String(await fk()).startsWith("editor-") ; i++) await press("ArrowDown");
  for (let i = 0; i < 12 && !["editor-start", "editor-save", "editor-cancel"].includes(await fk()); i++) await press("ArrowDown");
  log(await pressUntil("ArrowLeft", "editor-start", 4), "Reach Start timer with D-pad", await fk());
  await press("Enter");
  await page.waitForTimeout(300);
  log((await page.locator("article").count()) === 4, "Timer created from the remote");

  // --- AI Chef (demo) ---
  await page.goto(BASE + "/ai-chef");
  log(await waitFocus("prompt-0"), "AI Chef: first suggested prompt focused");
  await press("Enter");
  await page.waitForTimeout(1200);
  const chat = (await page.textContent("main")) ?? "";
  log(/DEMO MODE/.test(chat) && /Demo answer/.test(chat), "AI Chef demo mode is clearly labelled");
  log(/Kitchen OS recipe library/.test(chat), "Demo answer recommends recipes for ingredients");
  await shot("ai-chef");

  // --- Videos: offline/blocked YouTube shows a graceful error ---
  await page.goto(BASE + "/videos");
  log(await waitFocus("videos-hero"), "Videos: featured Watch now focused");
  log(await noOverflow(), "Videos: no horizontal overflow");
  await shot("videos");
  await press("Enter");
  await page.waitForURL("**/videos/**");
  const ok = await page
    .waitForFunction(() => /Video unavailable/.test(document.body.textContent || "") || document.querySelector("iframe"), null, { timeout: 16000 })
    .then(() => true)
    .catch(() => false);
  const hasError = /Video unavailable/.test((await page.textContent("body")) ?? "");
  log(ok, "Video player loads or shows a graceful error", hasError ? "error state shown (YouTube unreachable in test env)" : "player iframe created");
  await shot("video-player");
  await press("Escape");
  await page.waitForTimeout(500);
  log(page.url().endsWith("/videos"), "Back from the player returns to Videos");

  // --- Remote test screen + focus trap with hardware back ---
  await page.goto(BASE + "/settings/remote");
  await waitFocus("rt-cell-0");
  await press("ArrowRight");
  await press("ArrowDown");
  log((await fk()) === "rt-cell-5", "Remote test grid: Right then Down lands on tile 6", await fk());
  const logged = await page.locator("tbody tr").count();
  log(logged >= 2, "Key log records presses", `${logged} rows`);
  await page.locator('[data-focus-key="rt-open-modal"]').focus();
  await press("Enter");
  await waitFocus("rt-m-close");
  await page.evaluate(() => history.back());
  await page.waitForTimeout(400);
  log((await page.locator("[data-focus-scope=modal]").count()) === 0 && page.url().endsWith("/settings/remote"), "Hardware Back closes a modal");
  log((await fk()) === "rt-open-modal", "Focus returns to the opener", await fk());

  // Every route: no overflow, focus present after load
  for (const route of ["/", "/recipes", "/cooking", "/videos", "/ai-chef", "/favorites", "/timer", "/settings", "/settings/remote", "/recipes/beef-rendang"]) {
    await page.goto(BASE + route);
    await page.waitForTimeout(500);
    const focused = await page.evaluate(() => !!document.activeElement?.closest("[data-focusable]"));
    log((await noOverflow()) && focused, `Route ${route}: focus present & no overflow`);
    // Tiny-text check: no visible text under 15px at 1080p-equivalent
    const small = await page.evaluate((scale) => {
      const min = 15 * scale;
      return [...document.querySelectorAll("main *")]
        .filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
        .filter((el) => parseFloat(getComputedStyle(el).fontSize) < min && el.getBoundingClientRect().width > 0)
        .map((el) => el.textContent.trim().slice(0, 30));
    }, Math.min(width / 1920, height / 1080));
    if (small.length) log(false, `Route ${route}: text below 15px@1080p`, small.slice(0, 3).join(" | "));
  }
  await page.goto(BASE + "/settings");
  await shot("settings");
  await page.goto(BASE + "/favorites");
  await shot("favorites");

  await ctx.close();
}

try {
  await run(1920, 1080);
  await run(1280, 720);
} catch (e) {
  failures++;
  console.error("Test crashed:", e);
} finally {
  await browser.close();
  server.kill();
}

if (consoleErrors.length) {
  console.log("\nConsole errors:");
  consoleErrors.forEach((e) => console.log("  " + e));
}
console.log(`\n${passes} passed, ${failures} failed, ${consoleErrors.length} console errors`);
process.exit(failures || consoleErrors.length ? 1 : 0);
