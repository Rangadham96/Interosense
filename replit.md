# InteroSense - Mental Wellness Platform

## Overview
InteroSense is an enterprise-grade mobile mental wellness platform teaching interoceptive awareness (sensing internal body signals) through guided exercises, clinical symptom tracking, condition-specific programs, AI-driven personalization, body tracking, progress analytics, and educational content.

## Architecture
- **Frontend**: Expo React Native (React Native Web for browser, Expo Go for mobile)
- **Backend**: Express.js (minimal, mainly for API serving)
- **Storage**: AsyncStorage for local persistence (no database needed for current features)
- **State Management**: React Context (AppContext) + AsyncStorage persistence
- **Personalization**: Custom engine (lib/personalization-engine.ts) analyzing 9+ factors
- **Routing**: Expo Router (file-based)
- **Fonts**: Nunito (Google Fonts via @expo-google-fonts/nunito)

## Design System
- **Primary**: #6B5B95 (calming purple)
- **Secondary**: #88B3B5 (soothing teal)
- **Accent**: #E8B4B8 (gentle rose)
- **Background**: #F7F9FB
- **Font**: Nunito (400-800 weights)
- **Category Colors**: gut (#C4A484), movement (#6AABCF)
- No emojis anywhere in the app

## Project Structure
```
app/
  _layout.tsx           # Root layout with providers (fonts, context, React Query)
  onboarding.tsx        # 3 intro pages + 4-step setup (name, conditions, experience, goals)
  (tabs)/
    _layout.tsx         # Tab navigation (5 tabs)
    index.tsx           # Home/Dashboard with personalization engine
    exercises.tsx       # Exercise library with search/filter (8 categories)
    checkin.tsx         # Daily check-in (8-step: awareness, energy, sleep, stress, mood, sensations, body areas, notes)
    progress.tsx        # Progress analytics with assessment trends, stress/mood charts
    profile.tsx         # User profile with menu
  exercise/[id].tsx     # Exercise session player (timer, steps, completion, science metadata)
  article/[id].tsx      # Article detail view
  assessment/[id].tsx   # Clinical assessment flow (intro, questions, results)
  condition/[id].tsx    # Condition detail (neuroscience, symptoms, exercises, research)
  conditions.tsx        # Conditions library list (7 conditions)
  crisis.tsx            # Crisis support toolkit
  bodymap.tsx           # Interactive body map
  goals.tsx             # Personal goals tracker
  achievements.tsx      # Achievement badges
  settings.tsx          # App settings

constants/
  colors.ts             # Theme colors + category colors
  exercises.ts          # 25 exercises across 8 categories (MABT methodology)
  articles.ts           # 15 educational articles
  achievements.ts       # 30+ achievement badges
  clinical-scales.ts    # Clinical scales (GAD-7, PHQ-9, PCL-5, etc.)
  conditions.ts         # 7 conditions with neuroscience, research citations

contexts/
  AppContext.tsx         # Main state provider (sessions, checkins, assessments, wearable data, streaks, achievements, advisorState)

lib/
  storage.ts            # AsyncStorage CRUD helpers (UserProfile, SessionRecord, CheckinRecord, AssessmentRecord, WearableDataPoint)
  personalization-engine.ts  # AI advisor analyzing conditions, history, time-of-day, difficulty, mood, sleep, energy
  query-client.ts       # React Query client
```

## Key Features
- 25 guided exercises across 8 categories (heartbeat, breathing, body scanning, tension, temperature, exposure, gut, movement)
- MABT methodology with science notes, preparation tips, contraindications, expected sensations, research citations
- 8-step daily check-in (awareness, energy, sleep, stress, mood, sensations, body areas, notes)
- Clinical assessments (GAD-7, PHQ-9, PCL-5) with severity scoring and clinical interpretation
- 7-condition library with neuroscience, interoception connections, symptoms, research
- Personalization engine (9+ factors) generating recommendations, insights, next exercise suggestions
- Progress analytics with awareness trends, stress trends, mood distribution, assessment history
- Interactive body map for marking sensations
- 15 educational articles about interoception
- Achievement system with 30+ badges and 5 tiers
- Personal goal tracking
- Crisis support toolkit with grounding exercises
- Onboarding with condition selection and personalized plan summary

## Recent Changes (Feb 2026)
- Added personalization engine with reactive advisorState
- Rebuilt home screen as intelligent advisor dashboard
- Added clinical assessments (GAD-7, PHQ-9, PCL-5) with full flow
- Added 7-condition library with detail pages
- Enhanced check-in with stress level and body area tracking (8 steps)
- Enhanced progress screen with stress trends, mood distribution, assessment history
- Added gut and movement exercise categories
- Rebuilt onboarding with condition selection (4-step setup)
- Added science metadata to exercise pre-start screens

## User Preferences
- Design should look like professional multi-million dollar app (Headspace/Calm level)
- Calming purple-teal color scheme
- Nunito font throughout
- No emojis
- NativeTabs for liquid glass on iOS 26+
