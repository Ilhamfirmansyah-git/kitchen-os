# KITCHEN OS

**Your Personal Smart Kitchen Assistant.**
A TV-first web app that turns an Android TV box or stick into a cooking companion — browse recipes, follow step-by-step Cooking Mode, run multiple timers, watch tutorials and ask an AI Chef, all with a D-pad remote.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 and Lucide icons. No account needed; everything is stored on the TV.

---

## Features

| Area | What's included |
| --- | --- |
| Remote navigation | Custom spatial-navigation engine (arrows, OK/Enter/NumpadEnter, Back/Escape/Backspace, MediaPlayPause), row focus memory, focus restoration per screen, modal focus trapping, hardware-Back interception, focus recovery after re-renders, iframe focus guard, dev-only debug overlay, Remote Controls test screen |
| Home | Clock & date, greeting, recipe of the day hero, Continue Cooking, recommended row, quick actions, daily tip |
| Recipes | 35 recipes across 10 categories, search (name / ingredient / category), filters for time, difficulty, main ingredient, cuisine, meal type |
| Recipe detail | Prep/cook/total time, difficulty, equipment, ingredients with live serving scaling (1–16), metric/US units, °C/°F, steps (OK on a step starts cooking from it), linked video |
| Cooking Mode | Full screen, large instruction text, progress bar, per-step ingredients, one-press step timers, Previous/Next/Pause/Resume/Restart/Exit, auto-saved step + elapsed time, resume later, exit confirmation (key and hardware Back), completion screen |
| Kitchen Timer | Unlimited simultaneous timers, presets, h/m/s editor, rename, start/pause/resume/reset/delete, timestamp-based (no drift), survives navigation and reloads, global alarm dialog stoppable with OK/Back |
| AI Chef | Server-side `/api/ai-chef` (key never sent to the browser), loading/error/retry states, conversation history, suggested prompts, recipe links. Clearly labelled **Demo Mode** when no key is set |
| Videos | YouTube IFrame Player API with remote controls (play/pause, ±10 s seek, volume, mute, full screen), categories, search, related videos, graceful handling of blocked/removed embeds and offline |
| Favorites & history | Saved recipes, recently viewed, recently cooked, unfinished sessions |
| Settings | Theme, sound effects, alarm volume + test, clock format, temperature unit, measurements, reduce motion, remote test, app info, reset local data (with confirmation), optional Supabase backup |
| Offline / PWA | Web app manifest, service worker (production), all recipes/timers/cooking work offline, non-blocking offline banner |

---

## Requirements

- Node.js **20.9+** (tested on Node 22)
- npm 10+

## Installation

```bash
npm install
cp .env.example .env.local   # optional — only needed for AI Chef / cloud backup
```

## Development

```bash
npm run dev          # http://localhost:3000, also on your LAN (binds 0.0.0.0)
```

Development builds expose **Settings → Remote control → Navigation debug overlay**, which shows each key's `key`/`code`/`keyCode`, the mapped action and outlines the focused element.

## Quality checks

```bash
npm run typecheck    # TypeScript
npm run lint         # ESLint (next/core-web-vitals + TypeScript)
npm test             # Vitest unit tests (navigation geometry, timers, scaling, data integrity, demo AI)
npm run build        # Production build
npm run test:e2e     # Keyboard-only end-to-end run in Chrome at 1920×1080 and 1280×720
                     # (needs a production build; set CHROME_PATH if Chrome isn't at /usr/bin/google-chrome)
```

## Production build

```bash
npm run build
npm start            # serves on port 3000, bound to 0.0.0.0
```

## Deployment

Kitchen OS needs a Node server only for the two API routes (AI Chef and optional backup). Options:

- **Vercel:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Ilhamfirmansyah-git/kitchen-os)
  — or on vercel.com choose **Add New → Project → Import** this repository. Framework is detected as Next.js automatically; no build settings need changing. Add the optional environment variables below under **Settings → Environment Variables**, then redeploy.
- **Any other Next.js host:** import the repo, set the environment variables below, deploy.
- **Your own machine on the home network** (good for a kitchen TV): `npm run build && npm start` on a PC, NAS or Raspberry Pi, then open `http://<that-machine's-IP>:3000` on the TV.
- **Docker:** use the standard Next.js Node image (`node:22-alpine`, `npm ci && npm run build`, `npm start`).

Service workers and "install app" require **HTTPS** (or `localhost`). Over plain HTTP on a LAN the app works fully, but the offline cache and PWA install are skipped by the browser.

> Nothing has been deployed. Deploying, adding an AI key, or enabling Supabase may incur costs on those services.

## Environment variables

All are **server-side only** — never prefix them with `NEXT_PUBLIC_`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | No | Enables real AI Chef answers. Without it AI Chef runs in labelled Demo Mode. |
| `AI_CHEF_MODEL` | No | Model id override (default `claude-sonnet-5-5`). |
| `SUPABASE_URL` | No | Enables optional cloud backup/restore in Settings. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server key for the backup table (kept on the server). |

Supabase table for the optional backup:

```sql
create table kitchen_os_backups (
  device_id  text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table kitchen_os_backups enable row level security; -- only the server (service role) can access it
```

---

## Using it on Android TV

### Option A — TV browser (quickest)
1. Run Kitchen OS somewhere reachable from the TV (deployed URL or `http://<LAN-IP>:3000`).
2. On the Android TV, install a TV-friendly browser from the Play Store (for example **TV Bro**, **Puffin TV** or **Firefox**). Android TV has no built-in browser.
3. Open the URL, then bookmark it / add it to the browser's home screen.
4. Turn off any "mouse/cursor mode" in the browser so the D-pad sends arrow keys to the page. In TV Bro, use the browser's key-handling mode where arrows go to the web page.

### Option B — Launcher icon (Trusted Web Activity)
Wrap the deployed **HTTPS** URL as an Android app with Google's [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap), add `android.intent.category.LEANBACK_LAUNCHER` to the launcher activity and use `public/icons/tv-banner.png` (320×180) as the TV banner. TWAs need Chrome (or another TWA-capable browser) installed on the device.

### Remote mapping

| Remote button | Action |
| --- | --- |
| D-pad ▲ ▼ ◀ ▶ | Move focus (spatial). When nothing is above/below, the screen scrolls. |
| OK / Center | Activate the focused item |
| Back | Close dialog → otherwise go back. In Cooking Mode it asks before leaving. Home never exits on Back. |
| Play/Pause | Video play/pause; pauses/resumes the Cooking Mode clock and its step timers |
| Text fields | OK opens the on-screen keyboard; ▲/▼ leave the field; Back closes the keyboard |

Use **Settings → Open remote navigation test** on the TV to see exactly which keys your remote and browser send.

---

## Project structure

```
src/
  app/                    routes (App Router)
    page.tsx              Home
    recipes/              explorer + [slug] detail
    cooking/              hub + [slug] Cooking Mode
    videos/               browser + [id] player
    ai-chef/  favorites/  timer/  settings/ (+ settings/remote test screen)
    api/ai-chef/          server-side AI endpoint
    api/sync/             optional Supabase backup
  components/
    tv/                   Focusable, FocusGroup, TVButton, TVCard, TVModal, TVSidebar,
                          TVNavigationProvider, controls (stepper/toggle/choice/input), OptionPicker, DebugOverlay
    layout/  recipes/  cooking/  timer/  ai/  video/
  contexts/TimerContext   global multi-timer + alarm
  hooks/                  useNow, useOnline
  lib/
    navigation/           spatial geometry (pure), DOM engine, key normalisation, debug store
    storage/              versioned localStorage stores (useSyncExternalStore)
    recipes/  timers/  cooking/  ai/  audio/
  data/recipes/  data/videos/
  types/
public/sw.js, public/icons/
scripts/e2e.mjs           keyboard-only end-to-end test
```

### Adding recipe photos
The bundled recipes use generated artwork instead of stock photos. To add real photos, put an optimised JPEG/WebP (≈1280 px wide) in `public/images/recipes/` and set `image: "/images/recipes/<slug>.webp"` on the recipe in `src/data/recipes/*.ts`. Missing or broken images fall back to the artwork automatically. Steps also accept an optional `image`.

### Adding nutrition
`nutrition` is intentionally empty in the sample data. Only add it with a real `source`; the detail screen shows it automatically.

---

## What was tested

- `npm run typecheck`, `npm run lint`, `npm run build`: pass with no errors or warnings.
- 25 unit tests pass, including a data-integrity check that every recipe step references real ingredients and every ingredient is used.
- 102 automated end-to-end checks pass in **headless desktop Chrome**, driven only by keyboard events, at **1920×1080 and 1280×720**: sidebar and grid navigation, recipe → servings scaling → Cooking Mode, progress surviving reload, exit confirmation via Escape *and* via simulated hardware Back (`history.back()`), focus trapping and restoration, step timer creation, MediaPlayPause, completion screen, three simultaneous timers, alarm + stop with OK, timers surviving navigation, creating a timer with the D-pad, AI Chef demo labelling, video error handling, no horizontal overflow and no text under 15 px (1080p-equivalent) on every route, zero console errors.

**Not yet tested on a physical Android TV device or TV browser.** Key codes, the on-screen keyboard, the Back button and YouTube playback vary between TV browsers; please verify with the Remote Controls test screen on your hardware. YouTube playback itself could not be verified in the build environment (no access to YouTube); the error path was verified.

## Known limitations

- **Timers in the background:** timers are timestamp-based and always correct when you look at them, but browsers suspend pages that are closed, in the background, or when the TV sleeps. The alarm only sounds while Kitchen OS is open on screen; a timer that finished meanwhile is shown immediately on return. There are no system-level notifications.
- **Audio unlock:** browsers block sound until the first key press; the first OK press on any screen unlocks the alarm.
- **Back button behaviour** differs by TV browser. Kitchen OS handles key-based Back (Escape, Backspace, GoBack, keyCodes 4/461/10009) and history-based Back. Some browsers reserve Back for their own UI.
- **Text entry** depends on the TV's on-screen keyboard. Suggested prompts and presets exist so typing is rarely needed. Voice input is not implemented.
- **YouTube embeds:** owners can disable embedding or remove videos at any time; the player shows "Open on YouTube" and related videos instead. Ads and consent screens are controlled by YouTube.
- **Full screen** depends on the browser's Fullscreen API support.
- **Offline cache** needs HTTPS (or localhost) and a production build.
- **Recipes** are sample home-cooking recipes written for this app, not professionally tested; no nutrition values are bundled.
- **Storage** is per browser on the TV (localStorage). Clearing browser data clears Kitchen OS data unless you use the optional cloud backup.
- **Very old Android TV WebViews** (Chrome < 80) are untested; CSS `min()`, Fullscreen API and `scrollIntoView` options are required.
