# AFTERHOURS

A fictional electronic music festival concept. Static HTML, CSS, JavaScript, and a custom procedural WebGL sculpture. No frontend build or package installation is required.

## Preview

Run `node serve.cjs` from this folder, then open `http://127.0.0.1:4173`.

## Files

- `dist/index.html`: page structure, stage identities, FAQ, dialogs, and metadata.
- `dist/style.css`: responsive layout, typography, motion, and accessibility styles. Barlow Condensed and DM Sans are loaded from Google Fonts with local fallbacks.
- `dist/app.js`: fictional artists, timestamp-based scheduling, day filters, My Night, browser-local persistence, dialogs, and audio controls.
- `dist/sculpture.js`: generated torus-knot mesh and WebGL shading. No external 3D assets or libraries. A CSS sculpture remains available when WebGL cannot initialize.
- `.openai/hosting.json`: the registered Sites project and static output directory.

## Audio handoff

The user will supply a licensed track. No production soundtrack is bundled yet. Sound starts off. The current sound panel can load a local audio file for private preview; files are never uploaded or persisted. Playback begins only after pressing Play sound. Web Audio drives the sculpture from that track. The temporary QA tone lives outside the deployment folder and is not shipped.

When the track arrives, add the licensed asset to `dist/assets/`, connect it as the festival soundtrack, and retain explicit opt-in playback and a pause control. Do not autoplay.

## Content

The Relay, all eight artist profiles, and the schedule are fictional. The imagined festival runs on 23–24 July 2027 in Berlin, with sets continuing into the following calendar days. All timestamps include the Berlin summer-time offset. The ticket flow is a concept pass and does not collect money or data.

## Validation

See `QA.md` for checks and remaining limits.
