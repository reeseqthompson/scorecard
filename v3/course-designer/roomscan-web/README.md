RoomScan Web (WebXR, Chrome Android)

Overview
- Web app that runs on Chrome Android over HTTPS. Uses WebXR AR to capture room geometry and produce a 2D floor plan (SVG/JSON). MVP focuses on manual wall tracing via taps; includes an experimental depth-assisted auto walls mode when supported.

Requirements
- Android device that supports ARCore and Chrome with WebXR enabled (Chrome stable usually suffices).
- Serve over HTTPS (or localhost with `chrome://flags` insecure origins allowed for WebXR). PWA manifest included.

Quick start (local dev)
- Option A: Use a static HTTPS server (example using http-server):
  - `npm i -g http-server`
  - Generate a local cert or use `mkcert` (recommended). Then run: `http-server ./roomscan-web -S -C path/to/cert.pem -K path/to/key.pem`
- Option B: Host on any HTTPS static host (e.g., GitHub Pages, Netlify). Ensure `https://` origin.

Usage
1. Open the site on Chrome Android. Tap "Enter AR".
2. Toggle "Auto Walls" to enable depth-assisted wall extraction (worker-based RANSAC). Move slowly to let walls accumulate.
3. Manual walls: tap two or more points on walls to add segments; lines snap to orthogonal. Use Finish to stop scanning.
4. Openings: toggle Door or Window, then tap to place along walls (positioned at tap XZ).
5. Export: download `floorplan.svg` and `floorplan.json`.

Notes
- Scaling: Units are meters from WebXR; SVG export uses 100 px/m.
- Plane Detection API is not widely available; depth-assisted wall extraction is a heuristic and may be noisy.
- iOS Safari lacks full WebXR AR; this target is Android Chrome only.

Files
- `index.html` – UI shell + PWA manifest
- `style.css` – basic layout
- depth-worker.js – Web Worker for depth → wall segments (RANSAC)
- `geometry.js` – 2D primitives and merge/snap
- `export.js` – SVG/JSON generation and downloads
- `manifest.webmanifest`, `sw.js` – PWA scaffolding
