# Kitchen OS

A TV-first cooking companion designed for Android TV boxes/sticks and large kitchen displays.

## Stack
- Next.js App Router + React + TypeScript
- Tailwind CSS
- Lucide icons
- LocalStorage for favorites and preferences

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
- Kitchen timer
- Favorites persisted locally
- AI Chef explicitly marked as demo mode (no live AI API configured)
- TV remote keyboard foundation (arrow keys, Enter, Escape/Backspace)
- Responsive layouts for wide and smaller screens

## Important limitations
This is the first implementation slice, not a production-ready release. The recipe catalog currently contains 8 curated sample recipes; nutrition values are illustrative sample metadata and should be reviewed before being treated as dietary guidance. Timer persistence across browser termination, audible alarms under TV browser restrictions, true spatial D-pad focus navigation, offline service worker caching, YouTube playback, and a secure server-side AI integration remain to be implemented and tested on the target Android TV device.

No paid services or deployment have been configured.
