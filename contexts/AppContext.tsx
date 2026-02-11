import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Storage, UserProfile, SessionRecord, CheckinRecord, BodyMark, Goal, AppSettings, AssessmentRecord, WearableDataPoint } from '@/lib/storage';
import { getUnlockedAchievements } from '@/constants/achievements';
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
  bookmarks: string[];
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
  toggleBookmark: (articleId: string) => Promise<void>;
  markArticleRead: (articleId: string) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  addAssessment: (assessment: AssessmentRecord) => Promise<void>;
  addWearableData: (data: WearableDataPoint) => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
  refresh: () => Promise<void>;
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
  greeting: 'Welcome to InteroSense',
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

  const loadData = useCallback(async () => {
    try {
      const [ob, prof, sess, chk, bm, gl, bk, ar, st, assess, wear] = await Promise.all([
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
      ]);
      setOnboardingComplete(ob);
      setProfile(prof);
      setSessions(sess);
      setCheckins(chk);
      setBodyMarks(bm);
      setGoals(gl);
      setBookmarks(bk);
      setArticlesRead(ar);
      setSettings(st);
      setAssessments(assess);
      setWearableData(wear);
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

  const addSession = useCallback(async (session: SessionRecord) => {
    await Storage.addSession(session);
    setSessions(prev => [...prev, session]);
  }, []);

  const addCheckin = useCallback(async (checkin: CheckinRecord) => {
    await Storage.addCheckin(checkin);
    setCheckins(prev => [...prev, checkin]);
  }, []);

  const addBodyMark = useCallback(async (mark: BodyMark) => {
    await Storage.addBodyMark(mark);
    setBodyMarks(prev => [...prev, mark]);
  }, []);

  const clearBodyMarks = useCallback(async () => {
    await Storage.clearBodyMarks();
    setBodyMarks([]);
  }, []);

  const addGoal = useCallback(async (goal: Goal) => {
    await Storage.addGoal(goal);
    setGoals(prev => [...prev, goal]);
  }, []);

  const updateGoals = useCallback(async (newGoals: Goal[]) => {
    await Storage.setGoals(newGoals);
    setGoals(newGoals);
  }, []);

  const toggleBookmark = useCallback(async (articleId: string) => {
    await Storage.toggleBookmark(articleId);
    setBookmarks(prev =>
      prev.includes(articleId) ? prev.filter(id => id !== articleId) : [...prev, articleId]
    );
  }, []);

  const markArticleRead = useCallback(async (articleId: string) => {
    await Storage.markArticleRead(articleId);
    setArticlesRead(prev => prev.includes(articleId) ? prev : [...prev, articleId]);
  }, []);

  const updateSettings = useCallback(async (newSettings: AppSettings) => {
    await Storage.setSettings(newSettings);
    setSettings(newSettings);
  }, []);

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
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    isLoading,
    onboardingComplete,
    profile,
    sessions,
    checkins,
    bodyMarks,
    goals,
    bookmarks,
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
    toggleBookmark,
    markArticleRead,
    updateSettings,
    addAssessment,
    addWearableData: addWearableDataCb,
    updateProfile,
    refresh: loadData,
  }), [
    isLoading, onboardingComplete, profile, sessions, checkins, bodyMarks, goals,
    bookmarks, articlesRead, settings, assessments, wearableData, unlockedAchievements,
    totalSessions, totalMinutes, currentStreak, longestStreak, categoriesExplored,
    averageAwareness, maxAwareness, todayCheckedIn, todaySessionCount, advisorState,
    completeOnboarding, addSession, addCheckin, addBodyMark, clearBodyMarks,
    addGoal, updateGoals, toggleBookmark, markArticleRead, updateSettings,
    addAssessment, addWearableDataCb, updateProfile, loadData,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
