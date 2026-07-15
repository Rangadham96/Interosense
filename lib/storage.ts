import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ONBOARDING_COMPLETE: '@interosense:onboarding_complete',
  USER_PROFILE: '@interosense:user_profile',
  SESSIONS: '@interosense:sessions',
  CHECKINS: '@interosense:checkins',
  BODY_MARKS: '@interosense:body_marks',
  GOALS: '@interosense:goals',
  BOOKMARKS: '@interosense:bookmarks',
  ARTICLES_READ: '@interosense:articles_read',
  SETTINGS: '@interosense:settings',
  ASSESSMENTS: '@interosense:assessments',
  WEARABLE_DATA: '@interosense:wearable_data',
  EXERCISE_BOOKMARKS: '@interosense:exercise_bookmarks',
};

export interface UserProfile {
  name: string;
  goals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  dailyMinutes: number;
  createdAt: string;
  conditions?: string[];
  focusAreas?: string[];
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | '';
  dateOfBirth?: string;
  bio?: string;
  profileImage?: string;
}

export interface SessionRecord {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  category: string;
  completedAt: string;
  durationMinutes: number;
  rating: number;
  notes: string;
}

export interface CheckinRecord {
  id: string;
  date: string;
  awarenessScore: number;
  energyLevel: number;
  sleepQuality: number;
  mood: string;
  sensations: string[];
  notes: string;
  stressLevel?: number;
  bodyAreas?: string[];
}

export interface BodyMark {
  id: string;
  x: number;
  y: number;
  region: string;
  intensity: number;
  sensation: string;
  createdAt: string;
  view: 'front' | 'back';
}

export interface Goal {
  id: string;
  title: string;
  type: 'sessions' | 'streak' | 'minutes' | 'checkins' | 'awareness';
  targetValue: number;
  currentValue: number;
  createdAt: string;
  deadline?: string;
  completed: boolean;
}

export interface AppSettings {
  darkMode: boolean;
  notifications: boolean;
  reminderTime: string;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface AssessmentRecord {
  id: string;
  scaleId: string;
  scaleName: string;
  completedAt: string;
  totalScore: number;
  severity: string;
  answers: number[];
  subscaleScores?: Record<string, number>;
}

export interface WearableDataPoint {
  id: string;
  timestamp: string;
  heartRate?: number;
  hrv?: number;
  steps?: number;
  sleepHours?: number;
  restingHeartRate?: number;
  source: 'manual' | 'healthkit' | 'health-connect' | 'simulated';
}

async function getJSON<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

async function setJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const Storage = {
  async isOnboardingComplete(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
    return val === 'true';
  },
  async setOnboardingComplete(): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
  },

  async getUserProfile(): Promise<UserProfile | null> {
    return getJSON<UserProfile | null>(KEYS.USER_PROFILE, null);
  },
  async setUserProfile(profile: UserProfile): Promise<void> {
    await setJSON(KEYS.USER_PROFILE, profile);
  },

  async getSessions(): Promise<SessionRecord[]> {
    return getJSON<SessionRecord[]>(KEYS.SESSIONS, []);
  },
  async setSessions(sessions: SessionRecord[]): Promise<void> {
    await setJSON(KEYS.SESSIONS, sessions);
  },
  async addSession(session: SessionRecord): Promise<void> {
    const sessions = await this.getSessions();
    sessions.push(session);
    await setJSON(KEYS.SESSIONS, sessions);
  },

  async getCheckins(): Promise<CheckinRecord[]> {
    return getJSON<CheckinRecord[]>(KEYS.CHECKINS, []);
  },
  async setCheckins(checkins: CheckinRecord[]): Promise<void> {
    await setJSON(KEYS.CHECKINS, checkins);
  },
  async addCheckin(checkin: CheckinRecord): Promise<void> {
    const checkins = await this.getCheckins();
    checkins.push(checkin);
    await setJSON(KEYS.CHECKINS, checkins);
  },

  async getBodyMarks(): Promise<BodyMark[]> {
    return getJSON<BodyMark[]>(KEYS.BODY_MARKS, []);
  },
  async addBodyMark(mark: BodyMark): Promise<void> {
    const marks = await this.getBodyMarks();
    marks.push(mark);
    await setJSON(KEYS.BODY_MARKS, marks);
  },
  async clearBodyMarks(): Promise<void> {
    await setJSON(KEYS.BODY_MARKS, []);
  },
  async setBodyMarks(marks: BodyMark[]): Promise<void> {
    await setJSON(KEYS.BODY_MARKS, marks);
  },

  async getGoals(): Promise<Goal[]> {
    return getJSON<Goal[]>(KEYS.GOALS, []);
  },
  async setGoals(goals: Goal[]): Promise<void> {
    await setJSON(KEYS.GOALS, goals);
  },
  async addGoal(goal: Goal): Promise<void> {
    const goals = await this.getGoals();
    goals.push(goal);
    await setJSON(KEYS.GOALS, goals);
  },

  async getBookmarks(): Promise<string[]> {
    return getJSON<string[]>(KEYS.BOOKMARKS, []);
  },
  async toggleBookmark(articleId: string): Promise<boolean> {
    const bookmarks = await this.getBookmarks();
    const idx = bookmarks.indexOf(articleId);
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
      await setJSON(KEYS.BOOKMARKS, bookmarks);
      return false;
    } else {
      bookmarks.push(articleId);
      await setJSON(KEYS.BOOKMARKS, bookmarks);
      return true;
    }
  },

  async setBookmarks(bookmarks: string[]): Promise<void> {
    await setJSON(KEYS.BOOKMARKS, bookmarks);
  },

  async getArticlesRead(): Promise<string[]> {
    return getJSON<string[]>(KEYS.ARTICLES_READ, []);
  },
  async markArticleRead(articleId: string): Promise<void> {
    const read = await this.getArticlesRead();
    if (!read.includes(articleId)) {
      read.push(articleId);
      await setJSON(KEYS.ARTICLES_READ, read);
    }
  },

  async setArticlesRead(ids: string[]): Promise<void> {
    await setJSON(KEYS.ARTICLES_READ, ids);
  },

  async getSettings(): Promise<AppSettings> {
    return getJSON<AppSettings>(KEYS.SETTINGS, {
      darkMode: false,
      notifications: true,
      reminderTime: '09:00',
      reducedMotion: false,
      fontSize: 'medium',
    });
  },
  async setSettings(settings: AppSettings): Promise<void> {
    await setJSON(KEYS.SETTINGS, settings);
  },

  async getAssessments(): Promise<AssessmentRecord[]> {
    return getJSON<AssessmentRecord[]>(KEYS.ASSESSMENTS, []);
  },
  async setAssessments(assessments: AssessmentRecord[]): Promise<void> {
    await setJSON(KEYS.ASSESSMENTS, assessments);
  },
  async addAssessment(assessment: AssessmentRecord): Promise<void> {
    const assessments = await this.getAssessments();
    assessments.push(assessment);
    await setJSON(KEYS.ASSESSMENTS, assessments);
  },

  async getWearableData(): Promise<WearableDataPoint[]> {
    return getJSON<WearableDataPoint[]>(KEYS.WEARABLE_DATA, []);
  },
  async addWearableData(data: WearableDataPoint): Promise<void> {
    const existing = await this.getWearableData();
    existing.push(data);
    await setJSON(KEYS.WEARABLE_DATA, existing);
  },
  async setWearableData(data: WearableDataPoint[]): Promise<void> {
    await setJSON(KEYS.WEARABLE_DATA, data);
  },

  async setExerciseBookmarks(ids: string[]): Promise<void> {
    await setJSON(KEYS.EXERCISE_BOOKMARKS, ids);
  },

  async getExerciseBookmarks(): Promise<string[]> {
    return getJSON<string[]>(KEYS.EXERCISE_BOOKMARKS, []);
  },
  async toggleExerciseBookmark(exerciseId: string): Promise<boolean> {
    const bookmarks = await this.getExerciseBookmarks();
    const idx = bookmarks.indexOf(exerciseId);
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
      await setJSON(KEYS.EXERCISE_BOOKMARKS, bookmarks);
      return false;
    } else {
      bookmarks.push(exerciseId);
      await setJSON(KEYS.EXERCISE_BOOKMARKS, bookmarks);
      return true;
    }
  },

  async clearActivityData(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.SESSIONS, KEYS.CHECKINS, KEYS.ASSESSMENTS]);
  },
};
