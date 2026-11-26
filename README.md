# Kitchen OS

A TV-first cooking companion designed for Android TV boxes/sticks and large kitchen displays.

## Stack
- Next.js App Router + React + TypeScript
- Tailwind CSS
- Lucide icons
- LocalStorage for favorites, preferences, and timestamp-based timer recovery
- PWA manifest + lightweight service worker for repeat-visit shell caching

## Getting started
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Current preview
- Premium dark kitchen dashboard
- Recipe collection with search and category filters
- Recipe details with ingredient quantity scaling by serving count
- Step-by-step cooking mode
- Primary kitchen timer with timestamp-based countdown recovery after refresh/reopen and best-effort audio alert
- Multiple independent named timers with pause, resume, reset, delete, local persistence, visual completion state, and best-effort browser audio alarm
- Favorites and unfinished cooking sessions persisted locally; resume a recipe at the last completed step
- AI Chef server route using an OpenAI-compatible chat completions API; provider credentials stay server-side
- TV remote navigation using directional spatial focus based on visible element positions, plus focus restoration on page changes
- Responsive layouts for wide and smaller screens
- Installable PWA metadata, explicit offline fallback page, cached app-shell navigation, and live online/offline status

## Important limitations
This is the first implementation slice, not a production-ready release. The recipe catalog currently contains 30 sample recipes across Indonesian, Japanese, Korean, Chinese, Italian, Mediterranean, and Western dishes; Browser audio alarms are best-effort and may be blocked or delayed when the browser is suspended or the app is closed. Spatial D-pad navigation is heuristic and must be validated with a physical Android TV remote. Comprehensive offline data caching, The video page opens focused YouTube search results; playback is not embedded inside Kitchen OS. Configure the server-side AI environment variables from `.env.example` before using AI Chef. Test provider compatibility, rate limits, and Android TV behavior before release. The service worker caches the app shell and a dedicated offline page; external recipe images and AI requests still require internet, and the cached app shell is not a full offline guarantee.

No paid services or deployment have been configured.

## AI Chef configuration

Copy `.env.example` to `.env.local` and set:
- `KITCHEN_AI_BASE_URL`: OpenAI-compatible API base URL (defaults to OpenAI)
- `KITCHEN_AI_API_KEY`: secret API key (server only; never use a `NEXT_PUBLIC_` prefix)
- `KITCHEN_AI_MODEL`: model identifier supported by your provider

AI requests are sent to `/api/chef`. The route validates message length, applies a 30-second timeout, returns user-safe errors, and includes a basic per-instance IP rate limit (not a substitute for a distributed production rate limiter). No AI provider key is required for the app to build, but the AI Chef feature returns a configuration message until these variables are set.
