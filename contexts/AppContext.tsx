import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { Storage, UserProfile, SessionRecord, CheckinRecord, BodyMark, Goal, AppSettings, AssessmentRecord, WearableDataPoint } from '@/lib/storage';
import { apiPut } from '@/lib/api';
import { getUnlockedAchievements } from '@/constants/achievements';
import { buildDefaultGoals, createGoalFromPreset, getGoalProgress, getNextLevelPreset, normalizeGoals, resolveServerGoalState, GoalStats } from '@/constants/default-goals';
import { generateAdvisorState, AdvisorState } from '@/lib/personalization-engine';
import { format, isToday, isYesterday, differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';

interface AppState {
  isLoading: boolean;
  onboardingComplete: boolean;
  profile: UserProfile | null;
  sessions: SessionRecord[];
  checkins: CheckinRecord[];
  bodyMarks: BodyMark[];
  goals: Goal[];
  liveGoals: Goal[];
  pendingCelebration: Goal | null;
  bookmarks: string[];
  exerciseBookmarks: string[];
  articlesRead: string[];
  settings: AppSettings;
  assessments: AssessmentRecord[];
  wearableData: WearableDataPoint[];
  unlockedAchievements: string[];
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  categoriesExplored: number;
  averageAwareness: number;
  maxAwareness: number;
  todayCheckedIn: boolean;
  todaySessionCount: number;
  advisorState: AdvisorState;
}

interface AppActions {
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  addSession: (session: SessionRecord) => Promise<void>;
  addCheckin: (checkin: CheckinRecord) => Promise<void>;
  addBodyMark: (mark: BodyMark) => Promise<void>;
  clearBodyMarks: () => Promise<void>;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoals: (goals: Goal[]) => Promise<void>;
  removeGoal: (goalId: string) => Promise<void>;
  acknowledgeGoalCompletion: (goalId: string, addNextLevel: boolean) => Promise<void>;
  ensureDefaultGoals: () => Promise<void>;
  toggleBookmark: (articleId: string) => Promise<void>;
  markArticleRead: (articleId: string) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  addAssessment: (assessment: AssessmentRecord) => Promise<void>;
  addWearableData: (data: WearableDataPoint) => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
  toggleExerciseBookmark: (exerciseId: string) => Promise<void>;
  refresh: () => Promise<void>;
  hydrateFromServer: (data: { sessions?: SessionRecord[]; checkins?: CheckinRecord[]; assessments?: AssessmentRecord[]; preferences?: Record<string, unknown> | null }) => void;
  clearActivityData: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
}

type AppContextValue = AppState & AppActions;

const AppContext = createContext<AppContextValue | null>(null);


function calculateStreak(sessions: SessionRecord[]): { current: number; longest: number } {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  const uniqueDays = new Set<string>();
  sessions.forEach(s => {
    uniqueDays.add(format(parseISO(s.completedAt), 'yyyy-MM-dd'));
  });

  const sortedDays = Array.from(uniqueDays).sort().reverse();
  if (sortedDays.length === 0) return { current: 0, longest: 0 };

  let current = 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

  if (sortedDays[0] === today || sortedDays[0] === yesterday) {
    current = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const diff = differenceInCalendarDays(parseISO(sortedDays[i - 1]), parseISO(sortedDays[i]));
      if (diff === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  let longest = 1;
  let tempStreak = 1;
  const allSorted = Array.from(uniqueDays).sort();
  for (let i = 1; i < allSorted.length; i++) {
    const diff = differenceInCalendarDays(parseISO(allSorted[i]), parseISO(allSorted[i - 1]));
    if (diff === 1) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  longest = Math.max(longest, current);

  return { current, longest };
}

const defaultAdvisorState: AdvisorState = {
  recommendations: [],
  insights: [],
  nextExercise: null,
  greeting: 'Welcome to Interosense',
  streakMessage: 'Start your journey today',
  todayFocus: 'Begin with a simple breathing exercise to build your foundation.',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [bodyMarks, setBodyMarks] = useState<BodyMark[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [articlesRead, setArticlesRead] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
    notifications: true,
    reminderTime: '09:00',
    reducedMotion: false,
    fontSize: 'medium',
  });
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [wearableData, setWearableData] = useState<WearableDataPoint[]>([]);
  const [exerciseBookmarks, setExerciseBookmarks] = useState<string[]>([]);
  const [dismissedPresets, setDismissedPresets] = useState<string[]>([]);
  const [pendingCelebration, setPendingCelebration] = useState<Goal | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [ob, prof, sess, chk, bm, gl, bk, ar, st, assess, wear, exBk, dismissed] = await Promise.all([
        Storage.isOnboardingComplete(),
        Storage.getUserProfile(),
        Storage.getSessions(),
        Storage.getCheckins(),
        Storage.getBodyMarks(),
        Storage.getGoals(),
        Storage.getBookmarks(),
        Storage.getArticlesRead(),
        Storage.getSettings(),
        Storage.getAssessments(),
        Storage.getWearableData(),
        Storage.getExerciseBookmarks(),
        Storage.getDismissedPresets(),
      ]);
      setOnboardingComplete(ob);
      setProfile(prof);
      setSessions(sess);
      setCheckins(chk);
      setBodyMarks(bm);
      setGoals(normalizeGoals(gl));
      setDismissedPresets(dismissed);
      setBookmarks(bk);
      setArticlesRead(ar);
      setSettings(st);
      setAssessments(assess);
      setWearableData(wear);
      setExerciseBookmarks(exBk);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const { current: currentStreak, longest: longestStreak } = useMemo(() => calculateStreak(sessions), [sessions]);
  const categoriesExplored = useMemo(() => new Set(sessions.map(s => s.category)).size, [sessions]);
  const averageAwareness = useMemo(() => {
    if (checkins.length === 0) return 0;
    return Math.round(checkins.reduce((s, c) => s + c.awarenessScore, 0) / checkins.length * 10) / 10;
  }, [checkins]);
  const maxAwareness = useMemo(() => {
    if (checkins.length === 0) return 0;
    return Math.max(...checkins.map(c => c.awarenessScore));
  }, [checkins]);
  const todayCheckedIn = useMemo(() => {
    return checkins.some(c => isToday(parseISO(c.date)));
  }, [checkins]);
  const todaySessionCount = useMemo(() => {
    return sessions.filter(s => isToday(parseISO(s.completedAt))).length;
  }, [sessions]);

  const unlockedAchievements = useMemo(() => {
    return getUnlockedAchievements({
      totalSessions,
      currentStreak,
      categoriesExplored,
      totalCheckins: checkins.length,
      totalMinutes,
      maxAwareness,
      articlesRead: articlesRead.length,
    });
  }, [totalSessions, currentStreak, categoriesExplored, checkins.length, totalMinutes, maxAwareness, articlesRead.length]);

  const goalStats = useMemo<GoalStats>(() => ({
    totalSessions,
    currentStreak,
    totalMinutes,
    totalCheckins: checkins.length,
    averageAwareness,
  }), [totalSessions, currentStreak, totalMinutes, checkins.length, averageAwareness]);

  // Goals with live progress computed from current activity. This is what
  // every screen should render so progress is always current without reloads.
  const liveGoals = useMemo<Goal[]>(() => {
    return goals.map(goal => {
      const current = getGoalProgress(goal.type, goalStats);
      return { ...goal, currentValue: current, completed: current >= goal.targetValue };
    });
  }, [goals, goalStats]);

  // Activity kept in a ref (updated synchronously by hydrateFromServer) so
  // seeding right after hydration sees fresh data, not stale render state.
  const activityRef = useRef<{ sessions: SessionRecord[]; checkins: CheckinRecord[] }>({ sessions: [], checkins: [] });
  // True only after this login's server preferences were successfully
  // hydrated. Default seeding is disabled until then, so we never seed on
  // top of unknown server state (e.g. a failed preferences fetch).
  const goalStateAuthoritativeRef = useRef(false);
  // Prevents duplicate default-goal seeding when multiple callers race.
  const seedingInFlightRef = useRef(false);
  useEffect(() => { activityRef.current = { sessions, checkins }; }, [sessions, checkins]);

  const computeStatsNow = useCallback((): GoalStats => {
    const { sessions: s, checkins: c } = activityRef.current;
    return {
      totalSessions: s.length,
      currentStreak: calculateStreak(s).current,
      totalMinutes: s.reduce((sum, x) => sum + x.durationMinutes, 0),
      totalCheckins: c.length,
      averageAwareness: c.length === 0 ? 0 : Math.round(c.reduce((sum, x) => sum + x.awarenessScore, 0) / c.length * 10) / 10,
    };
  }, []);

  // Surface a celebration for the first completed goal not yet celebrated.
  useEffect(() => {
    if (pendingCelebration) return;
    const justCompleted = liveGoals.find(g => g.completed && !g.celebrated);
    if (justCompleted) setPendingCelebration(justCompleted);
  }, [liveGoals, pendingCelebration]);

  const advisorState = useMemo(() => {
    return generateAdvisorState(
      profile,
      sessions,
      checkins,
      assessments,
      todayCheckedIn,
      currentStreak,
      totalMinutes,
      wearableData,
    );
  }, [profile, sessions, checkins, assessments, todayCheckedIn, currentStreak, totalMinutes, wearableData]);

  const completeOnboarding = useCallback(async (prof: UserProfile) => {
    await Storage.setOnboardingComplete();
    await Storage.setUserProfile(prof);
    setOnboardingComplete(true);
    setProfile(prof);
  }, []);

  const markOnboardingComplete = useCallback(async () => {
    await Storage.setOnboardingComplete();
    setOnboardingComplete(true);
  }, []);

  const defaultSettings: AppSettings = { darkMode: false, notifications: true, reminderTime: '09:00', reducedMotion: false, fontSize: 'medium' };

  const prefsRef = useRef<{
    goals: Goal[];
    bodyMarks: BodyMark[];
    bookmarks: string[];
    exerciseBookmarks: string[];
    articlesRead: string[];
    settings: AppSettings;
    dismissedPresets: string[];
  }>({ goals: [], bodyMarks: [], bookmarks: [], exerciseBookmarks: [], articlesRead: [], settings: defaultSettings, dismissedPresets: [] });

  useEffect(() => {
    prefsRef.current = { goals, bodyMarks, bookmarks, exerciseBookmarks, articlesRead, settings, dismissedPresets };
  }, [goals, bodyMarks, bookmarks, exerciseBookmarks, articlesRead, settings, dismissedPresets]);

  const syncPrefsToServer = useCallback(() => {
    const { goals: g, bodyMarks: bm, bookmarks: ab, exerciseBookmarks: eb, articlesRead: ar, settings: st, dismissedPresets: dp } = prefsRef.current;
    apiPut('/api/user/preferences', { goals: g, bodyMarks: bm, articleBookmarks: ab, exerciseBookmarks: eb, articlesRead: ar, settings: st, dismissedPresets: dp }).catch(() => {});
  }, []);

  const addSession = useCallback(async (session: SessionRecord) => {
    await Storage.addSession(session);
    setSessions(prev => [...prev, session]);
  }, []);

  const addCheckin = useCallback(async (checkin: CheckinRecord) => {
    await Storage.addCheckin(checkin);
    setCheckins(prev => [...prev, checkin]);
  }, []);

  const addBodyMark = useCallback(async (mark: BodyMark) => {
    const newMarks = [...prefsRef.current.bodyMarks, mark];
    prefsRef.current = { ...prefsRef.current, bodyMarks: newMarks };
    setBodyMarks(newMarks);
    await Storage.addBodyMark(mark);
    syncPrefsToServer();
  }, [syncPrefsToServer]);

  const clearBodyMarks = useCallback(async () => {
    prefsRef.current = { ...prefsRef.current, bodyMarks: [] };
    setBodyMarks([]);
    await Storage.clearBodyMarks();
    syncPrefsToServer();
  }, [syncPrefsToServer]);

  const addGoal = useCallback(async (goal: Goal) => {
    const newGoals = [...prefsRef.current.goals, goal];
    prefsRef.current = { ...prefsRef.current, goals: newGoals };
    setGoals(newGoals);
    await Storage.addGoal(goal);
    syncPrefsToServer();
  }, [syncPrefsToServer]);

  const updateGoals = useCallback(async (newGoals: Goal[]) => {
    prefsRef.current = { ...prefsRef.current, goals: newGoals };
    setGoals(newGoals);
    await Storage.setGoals(newGoals);
    syncPrefsToServer();
  }, [syncPrefsToServer]);

  const removeGoal = useCallback(async (goalId: string) => {
    const removed = prefsRef.current.goals.find(g => g.id === goalId);
    const newGoals = prefsRef.current.goals.filter(g => g.id !== goalId);
    let newDismissed = prefsRef.current.dismissedPresets;
    // Removing a preset goal dismisses the preset permanently so it never reseeds.
    if (removed?.presetId && !newDismissed.includes(removed.presetId)) {
      newDismissed = [...newDismissed, removed.presetId];
      setDismissedPresets(newDismissed);
      Storage.setDismissedPresets(newDismissed).catch(() => {});
    }
    prefsRef.current = { ...prefsRef.current, goals: newGoals, dismissedPresets: newDismissed };
    setGoals(newGoals);
    await Storage.setGoals(newGoals);
    syncPrefsToServer();
  }, [syncPrefsToServer]);

  const acknowledgeGoalCompletion = useCallback(async (goalId: string, addNextLevel: boolean) => {
    const stats = computeStatsNow();
    let newGoals = prefsRef.current.goals.map(g => {
      if (g.id !== goalId) return g;
      const current = getGoalProgress(g.type, stats);
      return { ...g, currentValue: current, completed: current >= g.targetValue, celebrated: true };
    });
    const completedGoal = newGoals.find(g => g.id === goalId);
    if (addNextLevel && completedGoal) {
      const next = getNextLevelPreset(completedGoal.type as Goal['type'], completedGoal.targetValue);
      if (next
        && !prefsRef.current.dismissedPresets.includes(next.presetId)
        && !newGoals.some(g => g.presetId === next.presetId && !g.completed)) {
        newGoals = [...newGoals, createGoalFromPreset(next, stats)];
      }
    }
    prefsRef.current = { ...prefsRef.current, goals: newGoals };
    setGoals(newGoals);
    setPendingCelebration(null);
    await Storage.setGoals(newGoals);
    syncPrefsToServer();
  }, [syncPrefsToServer, computeStatsNow]);

  // Seed the curated default goals for users who have none. Only runs after
  // the server's preferences were SUCCESSFULLY hydrated for this login
  // (goalStateAuthoritativeRef), so we never seed on top of unknown server
  // state, removed defaults never resurrect, and server goals are never
  // overwritten.
  const ensureDefaultGoals = useCallback(async () => {
    // In-flight guard: seeding can be triggered from both the post-hydration
    // path and the goals screen; only one may run at a time.
    if (seedingInFlightRef.current) return;
    if (!goalStateAuthoritativeRef.current) return;
    if (prefsRef.current.goals.length > 0) return;
    seedingInFlightRef.current = true;
    try {
      const seeded = buildDefaultGoals(prefsRef.current.dismissedPresets, computeStatsNow());
      if (seeded.length === 0) return;
      // Update the ref synchronously (before any await) so a concurrent call
      // fails the empty-goals guard even if it slips past the flag.
      prefsRef.current = { ...prefsRef.current, goals: seeded };
      setGoals(seeded);
      await Storage.setGoals(seeded);
      syncPrefsToServer();
    } finally {
      seedingInFlightRef.current = false;
    }
  }, [syncPrefsToServer, computeStatsNow]);

  const toggleBookmark = useCallback(async (articleId: string) => {
    const cur = prefsRef.current.bookmarks;
    const newBookmarks = cur.includes(articleId) ? cur.filter(id => id !== articleId) : [...cur, articleId];
    prefsRef.current = { ...prefsRef.current, bookmarks: newBookmarks };
    setBookmarks(newBookmarks);
    await Storage.toggleBookmark(articleId);
    syncPrefsToServer();
  }, [syncPrefsToServer]);

  const markArticleRead = useCallback(async (articleId: string) => {
    if (prefsRef.current.articlesRead.includes(articleId)) return;
    const newRead = [...prefsRef.current.articlesRead, articleId];
    prefsRef.current = { ...prefsRef.current, articlesRead: newRead };
    setArticlesRead(newRead);
    await Storage.markArticleRead(articleId);
    syncPrefsToServer();
  }, [syncPrefsToServer]);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    prefsRef.current = { ...prefsRef.current, settings: newSettings };
    setSettings(newSettings);
    await Storage.setSettings(newSettings);
    syncPrefsToServer();
  }, [syncPrefsToServer]);

  const addAssessment = useCallback(async (assessment: AssessmentRecord) => {
    await Storage.addAssessment(assessment);
    setAssessments(prev => [...prev, assessment]);
  }, []);

  const addWearableDataCb = useCallback(async (data: WearableDataPoint) => {
    await Storage.addWearableData(data);
    setWearableData(prev => [...prev, data]);
  }, []);

  const updateProfile = useCallback(async (prof: UserProfile) => {
    await Storage.setUserProfile(prof);
    setProfile(prof);
    // Persist profile fields to the server so they survive reinstall / other devices.
    // Errors surface in console but do not block the local update.
    apiPut('/api/auth/profile', {
      name: prof.name,
      conditions: prof.conditions,
      experienceLevel: prof.experienceLevel,
      goals: prof.goals,
      dailyMinutes: String(prof.dailyMinutes),
      gender: prof.gender ?? null,
      dateOfBirth: prof.dateOfBirth ?? null,
      bio: prof.bio ?? null,
      profileImage: prof.profileImage ?? null,
    }).catch((e) => console.error('Profile server sync failed:', e));
  }, []);

  const toggleExerciseBookmarkCb = useCallback(async (exerciseId: string) => {
    const cur = prefsRef.current.exerciseBookmarks;
    const newBookmarks = cur.includes(exerciseId) ? cur.filter(id => id !== exerciseId) : [...cur, exerciseId];
    prefsRef.current = { ...prefsRef.current, exerciseBookmarks: newBookmarks };
    setExerciseBookmarks(newBookmarks);
    await Storage.toggleExerciseBookmark(exerciseId);
    syncPrefsToServer();
  }, [syncPrefsToServer]);

  const hydrateFromServer = useCallback((data: { sessions?: SessionRecord[]; checkins?: CheckinRecord[]; assessments?: AssessmentRecord[]; preferences?: Record<string, unknown> | null }) => {
    if (data.sessions !== undefined) {
      // Update the ref synchronously so any seeding that runs right after
      // hydration (before React re-renders) sees the fresh activity data.
      activityRef.current = { ...activityRef.current, sessions: data.sessions };
      setSessions(data.sessions);
      Storage.setSessions(data.sessions).catch(() => {});
    }
    if (data.checkins !== undefined) {
      activityRef.current = { ...activityRef.current, checkins: data.checkins };
      setCheckins(data.checkins);
      Storage.setCheckins(data.checkins).catch(() => {});
    }
    if (data.assessments !== undefined) {
      setAssessments(data.assessments);
      Storage.setAssessments(data.assessments).catch(() => {});
    }
    // preferences === null means the preferences fetch FAILED: keep local
    // state untouched and do NOT mark goal state authoritative, so default
    // seeding stays disabled until a successful fetch establishes truth.
    if (data.preferences !== undefined && data.preferences !== null) {
      const p = data.preferences;
      // Goals and dismissed presets are authoritative from the server on a
      // successful fetch: absent fields mean THIS user has none, so any
      // locally persisted values (possibly from a previous account on this
      // device) are replaced rather than kept.
      const { goals: serverGoals, dismissedPresets: serverDismissed } = resolveServerGoalState(p);
      goalStateAuthoritativeRef.current = true;
      setDismissedPresets(serverDismissed);
      setGoals(serverGoals);
      prefsRef.current = { ...prefsRef.current, goals: serverGoals, dismissedPresets: serverDismissed };
      Storage.setDismissedPresets(serverDismissed).catch(() => {});
      Storage.setGoals(serverGoals).catch(() => {});
      if (Array.isArray(p.bodyMarks)) {
        const vals = p.bodyMarks as BodyMark[];
        setBodyMarks(vals);
        prefsRef.current = { ...prefsRef.current, bodyMarks: vals };
        Storage.setBodyMarks(vals).catch(() => {});
      }
      if (Array.isArray(p.articleBookmarks)) {
        const vals = p.articleBookmarks as string[];
        setBookmarks(vals);
        prefsRef.current = { ...prefsRef.current, bookmarks: vals };
        Storage.setBookmarks(vals).catch(() => {});
      }
      if (Array.isArray(p.exerciseBookmarks)) {
        const vals = p.exerciseBookmarks as string[];
        setExerciseBookmarks(vals);
        prefsRef.current = { ...prefsRef.current, exerciseBookmarks: vals };
        Storage.setExerciseBookmarks(vals).catch(() => {});
      }
      if (Array.isArray(p.articlesRead)) {
        const vals = p.articlesRead as string[];
        setArticlesRead(vals);
        prefsRef.current = { ...prefsRef.current, articlesRead: vals };
        Storage.setArticlesRead(vals).catch(() => {});
      }
      if (p.settings && typeof p.settings === 'object') {
        const vals = p.settings as AppSettings;
        setSettings(vals);
        prefsRef.current = { ...prefsRef.current, settings: vals };
        Storage.setSettings(vals).catch(() => {});
      }
    }
  }, []);

  const clearActivityData = useCallback(async () => {
    await Storage.clearActivityData();
    const emptySettings: AppSettings = { darkMode: false, notifications: true, reminderTime: '09:00', reducedMotion: false, fontSize: 'medium' };
    setSessions([]);
    setCheckins([]);
    setAssessments([]);
    setGoals([]);
    setBodyMarks([]);
    setBookmarks([]);
    setExerciseBookmarks([]);
    setArticlesRead([]);
    setSettings(emptySettings);
    setDismissedPresets([]);
    setPendingCelebration(null);
    goalStateAuthoritativeRef.current = false;
    activityRef.current = { sessions: [], checkins: [] };
    prefsRef.current = { goals: [], bodyMarks: [], bookmarks: [], exerciseBookmarks: [], articlesRead: [], settings: emptySettings, dismissedPresets: [] };
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    isLoading,
    onboardingComplete,
    profile,
    sessions,
    checkins,
    bodyMarks,
    goals,
    liveGoals,
    pendingCelebration,
    bookmarks,
    exerciseBookmarks,
    articlesRead,
    settings,
    assessments,
    wearableData,
    unlockedAchievements,
    totalSessions,
    totalMinutes,
    currentStreak,
    longestStreak,
    categoriesExplored,
    averageAwareness,
    maxAwareness,
    todayCheckedIn,
    todaySessionCount,
    advisorState,
    completeOnboarding,
    addSession,
    addCheckin,
    addBodyMark,
    clearBodyMarks,
    addGoal,
    updateGoals,
    removeGoal,
    acknowledgeGoalCompletion,
    ensureDefaultGoals,
    toggleBookmark,
    markArticleRead,
    updateSettings,
    addAssessment,
    addWearableData: addWearableDataCb,
    updateProfile,
    toggleExerciseBookmark: toggleExerciseBookmarkCb,
    refresh: loadData,
    hydrateFromServer,
    clearActivityData,
    markOnboardingComplete,
  }), [
    isLoading, onboardingComplete, profile, sessions, checkins, bodyMarks, goals,
    liveGoals, pendingCelebration,
    bookmarks, exerciseBookmarks, articlesRead, settings, assessments, wearableData, unlockedAchievements,
    totalSessions, totalMinutes, currentStreak, longestStreak, categoriesExplored,
    averageAwareness, maxAwareness, todayCheckedIn, todaySessionCount, advisorState,
    completeOnboarding, addSession, addCheckin, addBodyMark, clearBodyMarks,
    addGoal, updateGoals, removeGoal, acknowledgeGoalCompletion, ensureDefaultGoals,
    toggleBookmark, markArticleRead, updateSettings,
    addAssessment, addWearableDataCb, updateProfile, toggleExerciseBookmarkCb, loadData,
    hydrateFromServer, clearActivityData, markOnboardingComplete,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
