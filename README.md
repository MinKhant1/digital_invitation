# Ignite the Next Decade

A cinematic, image-tracked WebAR invitation for the Yoma Bank × Prudential 5th anniversary. The site is a static React + Vite application. There is no backend and no audio.

Tracking uses the 8th Wall distributed engine (`@8thwall/engine-binary`) with image targets and SLAM. MindAR is no longer started.

## Experience

Guests open the site, press **Begin the Experience**, and point the phone at the printed invitation card. The engine anchors a golden number 5, glowing type, and a floating invitation plaque to the card.

Desktop development does not need a camera:

```text
http://localhost:5173/?preview=true
```

Optional query parameters:

- `quality=low|medium|high` — visual preset. Phones default to low, desktops to medium.
- `time=20` — preview only. Opens the timeline at that second.
- `trackingDebug=true` — live camera test with a card rectangle, a cube, and axes. The anniversary scene is not created.

## Assets

| Path | Role |
| --- | --- |
| `public/assets/models/five.glb` | Golden anniversary sculpture and its clips |
| `public/assets/tracking/invitation-card.jpg` | Card artwork, 1004×591 landscape |
| `public/assets/tracking/8thwall/` | 8th Wall image-target JSON, luminance image, and crops |
| `public/assets/tracking/invitation-card.mind` | Previous MindAR target. Kept on disk. The live pipeline does not load it. |
| `public/assets/branding/yoma-logo.png` | Yoma Bank logo |
| `public/assets/branding/prudential-logo.png` | Prudential logo |

`five.glb` is kept at the repository root as well. `npm run dev` and `npm run build` copy it into `public/assets/models/` when the root file is present.

The same commands copy `@8thwall/engine-binary` into `public/xr`. That folder is generated and is not committed. The engine script is injected when a guest starts the camera, with `data-preload-chunks="slam"`.

## Image target

The artwork on disk is `invitation-card.jpg`, not a PNG. It was compiled with the official CLI:

```bash
npx @8thwall/image-target-cli@latest
```

Answers used: the jpg path, flat, default crop, `public/assets/tracking/8thwall`, name `invitation-card`.

The CLI's flat target is a 3:4 region at least 480×640. This landscape card is rotated for that crop and center-trimmed to 788×591 of the rotated frame (`isRotated: true` in the JSON). The scene is scaled from that crop so the full printed card stays centered on the artwork. The debug rectangle shows the region the engine actually tracks.

`imagePath` in the JSON is `/assets/tracking/8thwall/invitation-card_luminance.jpg`. The session turns that into an absolute URL before `XR8.XrController.configure({ imageTargetData })`.

## Tracking behavior

Image target poses and the SLAM camera share one 8th Wall world. There is no separate persistent-anchor API in the version wired here, so the session does not invent one.

- **SEARCHING / ACQUIRING** — the ceremony stays hidden until the pose holds still.
- **TRACKING** — the engine pose is copied onto `ImageTargetPose`. `VisualStabilizationRoot` eases position and rotation toward it. GSAP never writes that pose.
- **TEMPORARILY_LOST** — while `trackingStatus` is `NORMAL`, the last image pose stays in the SLAM world and the camera keeps moving. The timeline pauses. This lasts `lossGraceMs` (1400).
- **LOST** — if SLAM is `LIMITED`, or the grace period ends, the scene hides. It is not left on screen indefinitely.
- **REACQUIRING** — the new pose eases in, or snaps when the jump is large. The timeline resumes. It does not restart.

`XR8.XrController.configure` does not expose a built-in filter switch. The debug panel says so. Visual smoothing can be turned off there.

## License

This is not legal approval. Read the license before the public event: https://github.com/8thwall/engine/blob/main/LICENSE

Niantic's published FAQ says the distributed binary may be used in a branded experience when you are selling the experience, not the engine. The license also requires their copyright notice, identification of Niantic Spatial, and a link to the license. `index.html` carries that notice. The generated `public/xr` folder includes the engine's own license file. Do not modify the engine files.

The MIT-licensed open-source engine does not include SLAM. This project loads the binary's `slam` chunk so image targets and world tracking can run together. VPS, maps, and hand tracking are not included and are not used.

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

## Deploy on Vercel

The project is a static Vite build. Camera access requires HTTPS, which Vercel provides.

1. Import the repository in Vercel.
2. Framework preset: Vite.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy.

`npm run build` copies the engine into `public/xr`, and Vite copies that into `dist`. `vercel.json` rewrites unknown routes to `index.html`. Real files such as `/xr/xr.js` and `/assets/tracking/8thwall/*` are still served.

## Phone test

These checks were not run on a physical phone in this workspace. Do them before the event, on iPhone Safari and Android Chrome, over HTTPS or an HTTPS tunnel to the dev server.

1. Open the site and tap **Begin the Experience**. Allow the rear camera. Confirm the camera starts only after that tap.
2. Open `/?trackingDebug=true`. Point at the printed card. The gold rectangle, red cube, and axes should sit on the card without a second camera layer.
3. Hold still. The pose-change numbers should stay small, and the cube should not buzz.
4. Tilt the card about 20–45 degrees while it remains recognizable. It should turn with the card and not jump or rescale wildly.
5. Move the phone. The cube should stay on the card.
6. Cover the card for under a second. The panel should read `TEMPORARILY_LOST` and `SLAM is holding the last image pose`, then return to `TRACKING` without resetting the count of a later full run.
7. Leave the card out of view for more than two seconds. The cube should hide and the scanning prompt should return. Bring the card back. It should ease into place, and reacquisitions should increase by one.
8. Turn smoothing off in the panel, repeat the still test, then turn it on. Turn the bounds rectangle off and on.
9. Leave debug mode. Run the full ceremony through the invitation reveal, then replay, capture a photo, and record a video where the browser allows it.
10. Open `/?preview=true` on a computer. Orbit the scene and scrub the timeline without a camera prompt.
11. Refresh twice and start again. Only one camera stream and one WebGL canvas should be active.

`/?preview=true` does not start 8th Wall. `/?trackingDebug=true` does.
