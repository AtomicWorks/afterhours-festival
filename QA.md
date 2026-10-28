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
