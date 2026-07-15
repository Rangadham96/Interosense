---
name: Onboarding completion flag is device-local
description: onboardingComplete is stored in AsyncStorage, not the server DB. On fresh browser/device sessions it starts false, triggering onboarding redirect even for existing users.
---

## Rule
`onboardingComplete` lives in AsyncStorage (via `Storage.isOnboardingComplete()`), not in PostgreSQL. On any new browser session or device, AsyncStorage is empty so the flag defaults to `false`.

**Why:** The original design stored onboarding state locally to allow offline use. But this breaks when users log in on a new device/browser — they get forced through onboarding again.

**How to apply:** In AuthGate (`app/_layout.tsx`), after authentication, check `user.experienceLevel` from the server. If set, call `markOnboardingComplete()` (AppContext) to write the flag to AsyncStorage immediately. This is the canonical fix — do not rely solely on AsyncStorage for onboarding state.

## Dev vs Production databases
Replit dev environment and production deployment use SEPARATE PostgreSQL databases. Data built up in dev (Expo Go / dev server) does NOT appear in production. Users must re-register and re-build progress on each environment.
