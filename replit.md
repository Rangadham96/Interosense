# Interosense - Mental Wellness Platform

## Overview
Interosense is an enterprise-grade mobile mental wellness platform teaching interoceptive awareness (sensing internal body signals) through guided exercises, clinical tracking, AI-driven personalization, body awareness measurement, and educational content. Designed to Headspace/Calm quality with a science-first, clinical-credibility approach.

## Architecture
- **Frontend**: Expo React Native (React Native Web for browser, Expo Go for mobile)
- **Backend**: Express.js with full REST API and session-based auth
- **Database**: PostgreSQL (primary store) + AsyncStorage (offline fallback / local cache)
- **State Management**: React Context (AppContext + AuthContext) with bidirectional cloud sync
- **AI**: Claude API (claude-3-5-haiku) via server/advisor.ts — once-per-day cached insights
- **Personalization**: Custom rule engine (lib/personalization-engine.ts) analyzing 9+ factors
- **Routing**: Expo Router (file-based), baseUrl="/app" for static web build
- **Fonts**: Nunito (Google Fonts via @expo-google-fonts/nunito)

## Design System
- **Primary**: #6B5B95 (calming purple) — used consistently across app AND landing page
- **Secondary**: #88B3B5 (soothing teal)
- **Accent**: #E8B4B8 (gentle rose)
- **Background**: #FAFAFE (light purple-white)
- **Font**: Nunito (400–800 weights)
- **Cards**: white background, borderRadius 16, subtle shadow
- **Category Colors**: gut (#C4A484), movement (#6AABCF)
- No emojis anywhere in the app
- Logo: assets/images/logo.png (abstract flowing figure in purple/teal/rose)

## Database Schema (PostgreSQL via Drizzle ORM)
```
users                    — auth, profile, conditions, experienceLevel, interoceptiveBaseline, onboardingPlan
exercise_sessions        — completed exercise records per user
daily_checkins           — check-in records (awareness, energy, sleep, stress, mood, sensations, body areas)
assessments              — GAD-7, PHQ-9, PCL-5, MAIA-2 results with subscale scores
daily_insights           — cached AI advisor insights (once per day per user)
password_reset_tokens    — time-limited tokens for email-based account recovery
```

## Project Structure
```
app/
  _layout.tsx             # Root layout with providers (fonts, context, React Query, auth gate)
  onboarding.tsx          # 7-step science-first intake (safety check → conditions → aha moment → plan)
  (tabs)/
    _layout.tsx           # Tab navigation (5 tabs: Home/Exercises/Check-In/Progress/Profile)
    index.tsx             # Home: Sense AI insight, recommended exercise, check-in prompt, streak
    exercises.tsx         # Exercise library with evidence badges, contraindication warnings
    checkin.tsx           # Daily check-in (intro + 8 steps + adaptive completion)
    progress.tsx          # MAIA-2 radar chart, awareness score, charts, top exercises
    profile.tsx           # Profile, 4-week programme, conditions, sign-out bottom sheet
  auth/
    login.tsx             # Login with eye toggle, logout banner, forgot password link
    register.tsx          # Registration with trust pledge, match indicator, eye toggles
    forgot-password.tsx   # Email-based password reset request
    reset-password.tsx    # Password reset with token validation
  exercise/[id].tsx       # Exercise player (pre-start science, safety escape, completion reflection)
  article/[id].tsx        # Article reader with scroll progress bar, related exercise
  assessment/[id].tsx     # Clinical assessment flow (GAD-7, PHQ-9, PCL-5)
  assessment/maia2.tsx    # MAIA-2 body awareness assessment (37 items, 8 dimensions)
  condition/[id].tsx      # Condition detail with disclaimer, interoception connection, support links
  conditions.tsx          # Conditions library (YOUR CONDITIONS + ALL CONDITIONS)
  articles.tsx            # Articles library ("Learn") with Start Here, read-time, read state
  crisis.tsx              # Crisis toolkit (clean white, emergency links, immediate exercises)
  bodymap.tsx             # Interactive body map
  goals.tsx               # Goals & Intentions tracker
  achievements.tsx        # Milestones with meanings
  settings.tsx            # App settings with delete account flow
  search.tsx              # Global search
  about.tsx               # About Interosense

server/
  index.ts                # Express server, static serving, workflow setup
  auth.ts                 # Auth routes (register, login, logout, me, profile, forgot/reset password)
  routes.ts               # API routes (sessions, checkins, assessments, advisor)
  advisor.ts              # Claude API service for Sense AI insights
  storage.ts              # All typed DB CRUD functions
  db.ts                   # Drizzle DB connection

shared/
  schema.ts               # Drizzle ORM schema for all tables

constants/
  colors.ts               # Theme colors + category colors
  exercises.ts            # 25 exercises across 8 categories (MABT methodology)
  articles.ts             # 15 educational articles
  achievements.ts         # 30+ achievement badges
  clinical-scales.ts      # GAD-7, PHQ-9, PCL-5 + full MAIA-2 (37 items, 8 subscales, Mehling et al. 2018)
  conditions.ts           # 7 conditions with neuroscience, interoception connections, research citations

contexts/
  AppContext.tsx           # Main state (sessions, checkins, assessments, achievements, advisorState)
                          # hydrateFromServer() on login, clearActivityData() on logout
  AuthContext.tsx          # Auth state, login/logout with server sync, fetchServerData()

lib/
  storage.ts              # AsyncStorage CRUD helpers + bulk hydration helpers
  personalization-engine.ts  # Rule-based advisor (9+ factors: conditions, history, time, mood, sleep, energy)
  api.ts                  # apiPost/apiPut helpers with credentials
  query-client.ts         # React Query client + getApiUrl()

components/
  RadarChart.tsx          # SVG spider chart for MAIA-2 8-dimension display (react-native-svg)
  GetHelpLink.tsx         # Persistent "Get Help" link used on all 5 tab screens → /crisis

scripts/
  post-merge.sh           # Auto-runs after every task merge: npm install + db:push
```

## Key Features
- **Sense AI Advisor**: Claude-powered daily insight on home screen, personalized to user conditions/history; cached once per day; falls back to static science cards offline
- **MAIA-2 Assessment**: Full 37-item validated instrument (Mehling et al. 2018, PLOS ONE) measuring 8 dimensions of interoceptive awareness; radar chart on progress screen; replaces simple average as the primary awareness score
- **7-step onboarding**: Safety check (crisis redirect if score ≤ 2), condition-adaptive body awareness baseline, personalised "aha moment" science screen, 4-week programme generation
- **Bidirectional cloud sync**: All activity writes to PostgreSQL AND AsyncStorage; on login, server data hydrates AppContext; logout clears local data
- **Forgot password**: Email-based reset via Resend (RESEND_API_KEY); dev fallback logs token to console
- **25 guided exercises** across 8 categories with evidence badges, contraindication warnings, science reflections on completion
- **8-step daily check-in** with adaptive completion screen based on scores
- **Clinical assessments**: GAD-7, PHQ-9, PCL-5 with severity scoring; MAIA-2 with subscale radar chart
- **7-condition library** with neuroscience, interoception connections, professional support links
- **Crisis toolkit**: Always accessible, clean white design, emergency tel: links, immediate exercises, fixed teal banner
- **"Get Help" link** visible on all 5 tab screens → /crisis
- **Progress screen**: MAIA-2 radar, interoceptive awareness score, "What helped most" top-rated exercises, clinical trends
- **Forgot password / account recovery** with secure time-limited tokens

## Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (configured)
- `SESSION_SECRET` — Express session secret (configured)
- `ANTHROPIC_API_KEY` — For Sense AI insights (request if missing; app falls back gracefully)
- `RESEND_API_KEY` — For password reset emails (optional; logs to console if missing)

## Post-Merge Setup
`scripts/post-merge.sh` runs automatically after every task merge:
1. `npm install --legacy-peer-deps`
2. `npm run db:push --force` (syncs schema, non-interactive)

## User Preferences
- Design: Headspace/Calm quality — calming purple-teal, generous spacing, no clutter
- Colour standard: #6B5B95 everywhere (app + landing page) — do NOT use #6B46C1
- Nunito font throughout, no emojis, borderRadius 16 for cards
- "Interosense" with lowercase 's' in product copy
- NativeTabs for liquid glass on iOS 26+
- Logo: assets/images/logo.png (abstract flowing figure) — use everywhere, no borderRadius clipping
