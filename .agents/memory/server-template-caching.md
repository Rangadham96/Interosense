---
name: Server HTML template caching
description: Landing page and pitch deck HTML templates are read once at server startup, not per request.
---

The static HTML templates in `server/templates/` (landing page at `/`, pitch deck at `/pitch`) are loaded with `fs.readFileSync` at server startup and held in memory.

**Why:** Editing a template and curling the route showed stale content; only a backend restart picked up the change.

**How to apply:** After editing any file in `server/templates/`, restart the backend workflow before verifying the change in the browser or with curl.
