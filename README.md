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
- Recipe details and serving selector
- Step-by-step cooking mode
- Primary kitchen timer with timestamp-based countdown recovery after refresh/reopen
- Multiple independent named timers with pause, resume, reset, delete, local persistence, visual completion state, and best-effort browser audio alarm
- Favorites and unfinished cooking sessions persisted locally; resume a recipe at the last completed step
- AI Chef explicitly marked as demo mode (no live AI API configured)
- TV remote navigation using directional spatial focus based on visible element positions, plus focus restoration on page changes
- Responsive layouts for wide and smaller screens
- Installable PWA metadata and basic offline fallback

## Important limitations
This is the first implementation slice, not a production-ready release. The recipe catalog currently contains 8 sample recipes; nutrition values are illustrative metadata and should not be treated as dietary guidance. Browser audio alarms are best-effort and may be blocked or delayed when the browser is suspended or the app is closed. Spatial D-pad navigation is heuristic and must be validated with a physical Android TV remote. Comprehensive offline data caching, YouTube playback, and a secure server-side AI integration remain to be implemented and tested on the target Android TV device. The service worker caches the app shell on repeat visits; it does not guarantee that every recipe image or route works offline.

No paid services or deployment have been configured.
