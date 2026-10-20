# Ignite the Next Decade

A cinematic, image-tracked WebAR invitation for the Yoma Bank × Prudential 5th anniversary. The site is a static React + Vite application. There is no backend and no audio.

## Experience

Guests open the site, press **Begin the Experience**, and point the phone at the printed invitation card. MindAR anchors a golden number 5, two silk cloths, glowing type, and a floating invitation plaque to the card.

Desktop development does not need a camera:

```text
http://localhost:5173/?preview=true
```

Optional query parameters:

- `quality=low|medium|high` — visual preset. Phones default to low, desktops to medium.
- `time=20` — preview only. Opens the timeline at that second.

## Assets

These files are already supplied. Do not replace them.

| Path | Role |
| --- | --- |
| `public/assets/models/five.glb` | Golden anniversary sculpture and its clips |
| `public/assets/tracking/invitation-card.mind` | Compiled MindAR image target |
| `public/assets/tracking/invitation-card.jpg` | Card artwork, 1004×591 |
| `public/assets/branding/yoma-logo.png` | Yoma Bank logo |
| `public/assets/branding/prudential-logo.png` | Prudential logo |

`five.glb` is kept at the repository root as well. `npm run dev` and `npm run build` copy it into `public/assets/models/` when the root file is present.

The tracking image is a landscape card. The scene uses that aspect ratio so the target stays aligned. It is not a portrait layout.

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

`mind-ar` depends on the Node `canvas` package, which is not required in the browser. If a native canvas build fails during install, install with `npm install --ignore-scripts`. The browser bundle does not use that native module.

## Deploy on Vercel

The project is a static Vite build. Camera access requires HTTPS, which Vercel provides.

1. Import the repository in Vercel.
2. Framework preset: Vite.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy.

`vercel.json` rewrites unknown routes to `index.html` and caches `/assets/*`. No server is required.

Open the production URL on a phone, allow the camera, and frame the printed card. Use `/?preview=true` on a computer to inspect the same scene with orbit controls and the lil-gui panel.

## Tracking notes

MindAR's One Euro filter is configured with `filterMinCF: 0.001` and `filterBeta: 1000`. A beta near `0.01` makes the sculpture lag far behind the phone. `1000` is the library default and keeps the scene locked to the card.

A short grace period holds the last good pose when the card is briefly lost. The cinematic timeline is not restarted. Reacquiring the card resumes it.

## What was verified here

- TypeScript check and the Vite production build.
- The landing page and the desktop preview in a browser, including play, pause, scrub, and the final invitation state.

A physical phone, the printed card, camera permission, image tracking, and the photo or video composite were not tested on a device in this environment. Confirm those on an iPhone in Safari and an Android phone in Chrome before the event.
