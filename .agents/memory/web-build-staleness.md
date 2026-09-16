---
name: Stale web build at /app
description: The Express server serves a static Expo web export from dist/ under /app; merges rebuild it, but source edits do not.
---

The backend serves the Expo web app as a static export (`dist/`) under `/app`. The post-merge setup regenerates it and fails if export fails. Frontend source changes made between merges are not visible there until an export runs.

**Why:** Verification against `/app` can pass or fail based on a stale bundle rather than the current source, producing misleading results.

**How to apply:** Merges need no manual export. Before verifying an unmerged frontend change through `/app`, regenerate the web export first.
