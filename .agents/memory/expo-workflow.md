---
name: Expo workflow on Replit
description: Stable workflow setup for the Expo packager when Express serves the web preview.
---

When Express serves the exported web app and owns the main preview, run the Expo Metro packager as a console workflow without a port health gate. Metro should ignore Replit-managed temporary directories such as `.local`, `.config`, and `.cache`.

**Why:** Expo can bundle and return HTTP 200 but still be terminated by a workflow port wait that is unnecessary for a native packager. Chromium profile directories can also disappear while Metro is walking them, causing an `ENOENT` watcher crash.

**How to apply:** Keep the backend as the preview web server. Use the Expo workflow for native development and QR access, not as a second webview. If Metro reports a missing file below a managed temporary directory, exclude the directory rather than recreating ephemeral files.