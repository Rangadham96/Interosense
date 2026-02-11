# Interosense - Mental Wellness Platform

## Overview
Interosense is an enterprise-grade mobile mental wellness platform teaching interoceptive awareness (sensing internal body signals) through guided exercises, body tracking, progress analytics, and educational content.

## Architecture
- **Frontend**: Expo React Native (React Native Web for browser, Expo Go for mobile)
- **Backend**: Express.js (minimal, mainly for API serving)
- **Storage**: AsyncStorage for local persistence (no database needed for current features)
- **State Management**: React Context (AppContext) + AsyncStorage persistence
- **Routing**: Expo Router (file-based)
- **Fonts**: Nunito (Google Fonts via @expo-google-fonts/nunito)

## Design System
- **Primary**: #6B5B95 (calming purple)
- **Secondary**: #88B3B5 (soothing teal)
- **Accent**: #E8B4B8 (gentle rose)
- **Background**: #F7F9FB
- **Font**: Nunito (400-800 weights)
- No emojis anywhere in the app

## Project Structure
```
app/
  _layout.tsx           # Root layout with providers (fonts, context, React Query)
  onboarding.tsx        # 4-page onboarding with profile setup
  (tabs)/
    _layout.tsx         # Tab navigation (5 tabs)
    index.tsx           # Home/Dashboard
    exercises.tsx       # Exercise library with search/filter
    checkin.tsx         # Daily check-in (6-step form)
    progress.tsx        # Progress analytics dashboard
    profile.tsx         # User profile with menu
  exercise/[id].tsx     # Exercise session player (timer, steps, completion)
  article/[id].tsx      # Article detail view
  crisis.tsx            # Crisis support toolkit
  bodymap.tsx           # Interactive body map
  goals.tsx             # Personal goals tracker
  achievements.tsx      # Achievement badges
  settings.tsx          # App settings

constants/
  colors.ts             # Theme colors
  exercises.ts          # 20 exercises across 6 categories
  articles.ts           # 15 educational articles
  achievements.ts       # 30+ achievement badges

contexts/
  AppContext.tsx         # Main state provider (sessions, checkins, streaks, achievements)

lib/
  storage.ts            # AsyncStorage CRUD helpers
  query-client.ts       # React Query client
```

## Key Features
- 20 guided exercises across 6 categories (heartbeat, breathing, body scanning, tension, temperature, exposure)
- Step-by-step exercise player with countdown timer
- 6-step daily check-in (awareness, energy, sleep, mood, sensations, notes)
- Progress analytics with visual charts
- Interactive body map for marking sensations
- 15 educational articles about interoception
- Achievement system with 30+ badges and 5 tiers
- Personal goal tracking
- Crisis support toolkit with grounding exercises
- Onboarding flow with profile setup

## User Preferences
- Design should look like professional multi-million dollar app (Headspace/Calm level)
- Calming purple-teal color scheme
- Nunito font throughout
- No emojis
- NativeTabs for liquid glass on iOS 26+
