---
name: Stale web build at /app
description: The Express server serves a static Expo web export from dist/ under /app; it does not auto-rebuild.
---

The backend serves the Expo web app as a static export (`dist/`) under `/app`. Frontend source changes are NOT visible there until the export is regenerated (`npx expo export --platform web --output-dir dist`).

**Why:** Verification against `/app` can pass or fail based on a stale bundle rather than the current source, producing misleading results.

**How to apply:** Before verifying any frontend change through `/app`, regenerate the web export first.
