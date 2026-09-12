# Zikzik AI

A polished desktop productivity assistant built with React, TypeScript, Tailwind CSS, Framer Motion and Lucide icons.

## Features

- **Dashboard** — greeting, search, category tabs, AI command box with quick prompts, Today's Focus task list (interactive checkboxes), Quick Actions, Calendar, animated daily-goal progress ring, and Recent Activity.
- **Voice Mode** — opens from any microphone button. Full-screen dark stage with the `BLOBANIMATION.mp4` orb (looping, cropped, controls hidden), animated waveform, mic controls and ESC to exit.
- Smooth dashboard ↔ voice mode transitions via Framer Motion `AnimatePresence`.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`. The app is Vercel-ready (`vercel.json` included).
