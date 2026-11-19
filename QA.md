# Validation — 29 October 2026

Verified in the Codex in-app browser against the local static server:

- Page responds HTTP 200; WebGL sculpture renders; no warning/error console entries in the inspected session.
- Desktop composition inspected at an effective CSS viewport of 1440 × 900.
- Mobile composition inspected at an effective CSS viewport of 390 × 844. Corrected a clipped hero wordmark; final heading bounds remain within the viewport and the page has no horizontal overflow at that size.
- Add two overlapping Friday artists; My Night displays chronological sets and reciprocal overlap warnings.
- Saved artists survive a reload. Clear restores the empty state and selection count.
- Saturday filter displays four matching artists.
- Artist detail action adds AFTERIMAGE to My Night; Saturday view displays its after-midnight set.
- After-midnight index entries include +1; artist details use the actual calendar start date.
- Sound initially remains off. A locally generated temporary WAV loads, starts only after Play sound, and pauses through the matching control. No test audio is deployed.
- Concept pass displays its non-sale status and directs visitors to the lineup.
- Escape dismisses a dialog and returns focus to its opener. Motion control changes to Resume motion and stops decorative animation.
- Native modal dialogs and visible focus styles support keyboard operation.

Remaining limits: no real mobile hardware/Safari test, no formal performance benchmark or full accessibility audit. Reduced-motion behavior and the WebGL fallback are implemented but were not forced through browser emulation. The user's licensed track is pending; playback of that specific track cannot be verified yet. The hosted private URL may require the owner's sign-in.

# Motion pass — 19 November 2026

Verified in the Claude desktop browser pane against `node serve.cjs`, desktop 1440 × 900 and mobile 375 × 812:

- First-visit loader counts to 100, wipes away, and the wordmark and meta animate in over a splash on the hero water; repeat visits in the same session skip the loader. No console errors.
- Nav becomes a blurred bar on scroll, hides on scroll down and returns on scroll up; the active section is underlined. Scroll progress bar tracks the page.
- Hero background is a WebGL water surface (`water.js`, replacing the earlier sculpture): the cursor leaves a ripple wake, clicks splash, the glint follows the pointer, and the text above never moves. Verified rendering on desktop and mobile.
- Crossed tapes loop seamlessly and speed up/reverse with scroll velocity. Manifesto words light up as they scroll through.
- Lineup: hover preview card with generated art and the VIEW cursor; adding an artist pops the button, flies a spark into My night and bumps the counter. Day filter re-staggers the rows.
- Stage cards tilt with glare; invitation outline text fills on scroll; FAQ answers animate open (Chromium `::details-content`; other browsers open instantly).
- Dialogs fade/scale in, My night slides in from the right, the concept pass has a sheen and scanner line.
- Pause motion freezes the tapes and decorative animation. Mobile has no horizontal overflow; cursor and hover preview are disabled on touch.

Not covered: Safari/Firefox, real devices, and forced reduced-motion emulation (handled by the existing global rule plus JS checks, but not exercised).
