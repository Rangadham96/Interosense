export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tier: AchievementTier;
  iconName: string;
  category: 'consistency' | 'exploration' | 'mastery' | 'progress' | 'special';
  requirement: {
    type: 'sessions' | 'streak' | 'categories' | 'checkins' | 'minutes' | 'awareness' | 'exercises' | 'articles';
    value: number;
  };
}

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-session', title: 'First Breath', description: 'Complete your first exercise', tier: 'bronze', iconName: 'play-circle', category: 'mastery', requirement: { type: 'sessions', value: 1 } },
  { id: 'five-sessions', title: 'Getting Started', description: 'Complete 5 exercises', tier: 'bronze', iconName: 'trending-up', category: 'mastery', requirement: { type: 'sessions', value: 5 } },
  { id: 'ten-sessions', title: 'Building Momentum', description: 'Complete 10 exercises', tier: 'silver', iconName: 'zap', category: 'mastery', requirement: { type: 'sessions', value: 10 } },
  { id: 'twenty-five-sessions', title: 'Dedicated Practitioner', description: 'Complete 25 exercises', tier: 'gold', iconName: 'award', category: 'mastery', requirement: { type: 'sessions', value: 25 } },
  { id: 'fifty-sessions', title: 'Interoception Master', description: 'Complete 50 exercises', tier: 'platinum', iconName: 'star', category: 'mastery', requirement: { type: 'sessions', value: 50 } },
  { id: 'hundred-sessions', title: 'Legendary Awareness', description: 'Complete 100 exercises', tier: 'diamond', iconName: 'sun', category: 'mastery', requirement: { type: 'sessions', value: 100 } },

  { id: 'streak-3', title: 'Three Day Flame', description: 'Practice 3 days in a row', tier: 'bronze', iconName: 'flame', category: 'consistency', requirement: { type: 'streak', value: 3 } },
  { id: 'streak-7', title: 'Week Warrior', description: 'Practice 7 days in a row', tier: 'silver', iconName: 'flame', category: 'consistency', requirement: { type: 'streak', value: 7 } },
  { id: 'streak-14', title: 'Fortnight Focus', description: 'Practice 14 days in a row', tier: 'gold', iconName: 'flame', category: 'consistency', requirement: { type: 'streak', value: 14 } },
  { id: 'streak-30', title: 'Monthly Master', description: 'Practice 30 days in a row', tier: 'platinum', iconName: 'flame', category: 'consistency', requirement: { type: 'streak', value: 30 } },
  { id: 'streak-60', title: 'Unstoppable', description: 'Practice 60 days in a row', tier: 'diamond', iconName: 'flame', category: 'consistency', requirement: { type: 'streak', value: 60 } },

  { id: 'explore-2', title: 'Curious Mind', description: 'Try exercises from 2 categories', tier: 'bronze', iconName: 'compass', category: 'exploration', requirement: { type: 'categories', value: 2 } },
  { id: 'explore-4', title: 'Wide Explorer', description: 'Try exercises from 4 categories', tier: 'silver', iconName: 'compass', category: 'exploration', requirement: { type: 'categories', value: 4 } },
  { id: 'explore-6', title: 'Full Spectrum', description: 'Try all 6 exercise categories', tier: 'gold', iconName: 'compass', category: 'exploration', requirement: { type: 'categories', value: 6 } },

  { id: 'checkin-5', title: 'Body Listener', description: 'Complete 5 daily check-ins', tier: 'bronze', iconName: 'clipboard', category: 'progress', requirement: { type: 'checkins', value: 5 } },
  { id: 'checkin-15', title: 'Signal Tracker', description: 'Complete 15 daily check-ins', tier: 'silver', iconName: 'clipboard', category: 'progress', requirement: { type: 'checkins', value: 15 } },
  { id: 'checkin-30', title: 'Data Driven', description: 'Complete 30 daily check-ins', tier: 'gold', iconName: 'clipboard', category: 'progress', requirement: { type: 'checkins', value: 30 } },

  { id: 'minutes-30', title: 'Half Hour Hero', description: 'Practice for 30 total minutes', tier: 'bronze', iconName: 'clock', category: 'mastery', requirement: { type: 'minutes', value: 30 } },
  { id: 'minutes-120', title: 'Two Hour Journey', description: 'Practice for 2 total hours', tier: 'silver', iconName: 'clock', category: 'mastery', requirement: { type: 'minutes', value: 120 } },
  { id: 'minutes-300', title: 'Five Hour Flow', description: 'Practice for 5 total hours', tier: 'gold', iconName: 'clock', category: 'mastery', requirement: { type: 'minutes', value: 300 } },
  { id: 'minutes-600', title: 'Ten Hour Sage', description: 'Practice for 10 total hours', tier: 'platinum', iconName: 'clock', category: 'mastery', requirement: { type: 'minutes', value: 600 } },

  { id: 'awareness-5', title: 'Tuning In', description: 'Reach awareness score of 5', tier: 'bronze', iconName: 'radio', category: 'progress', requirement: { type: 'awareness', value: 5 } },
  { id: 'awareness-7', title: 'Sharp Senses', description: 'Reach awareness score of 7', tier: 'silver', iconName: 'radio', category: 'progress', requirement: { type: 'awareness', value: 7 } },
  { id: 'awareness-9', title: 'Mastery Signal', description: 'Reach awareness score of 9', tier: 'gold', iconName: 'radio', category: 'progress', requirement: { type: 'awareness', value: 9 } },

  { id: 'read-3', title: 'Knowledge Seeker', description: 'Read 3 articles', tier: 'bronze', iconName: 'book', category: 'exploration', requirement: { type: 'articles', value: 3 } },
  { id: 'read-8', title: 'Well Read', description: 'Read 8 articles', tier: 'silver', iconName: 'book', category: 'exploration', requirement: { type: 'articles', value: 8 } },
  { id: 'read-15', title: 'Scholar', description: 'Read all articles', tier: 'gold', iconName: 'book', category: 'exploration', requirement: { type: 'articles', value: 15 } },

  { id: 'first-bodymap', title: 'Body Cartographer', description: 'Mark your first body map sensation', tier: 'bronze', iconName: 'map-pin', category: 'special', requirement: { type: 'sessions', value: 1 } },
  { id: 'night-owl', title: 'Night Practitioner', description: 'Complete an exercise after 10pm', tier: 'bronze', iconName: 'moon', category: 'special', requirement: { type: 'sessions', value: 1 } },
  { id: 'early-bird', title: 'Dawn Awareness', description: 'Complete an exercise before 7am', tier: 'bronze', iconName: 'sunrise', category: 'special', requirement: { type: 'sessions', value: 1 } },
];

export function getUnlockedAchievements(stats: {
  totalSessions: number;
  currentStreak: number;
  categoriesExplored: number;
  totalCheckins: number;
  totalMinutes: number;
  maxAwareness: number;
  articlesRead: number;
}): string[] {
  const unlocked: string[] = [];
  for (const achievement of ACHIEVEMENTS) {
    const { type, value } = achievement.requirement;
    let met = false;
    switch (type) {
      case 'sessions': met = stats.totalSessions >= value; break;
      case 'streak': met = stats.currentStreak >= value; break;
      case 'categories': met = stats.categoriesExplored >= value; break;
      case 'checkins': met = stats.totalCheckins >= value; break;
      case 'minutes': met = stats.totalMinutes >= value; break;
      case 'awareness': met = stats.maxAwareness >= value; break;
      case 'articles': met = stats.articlesRead >= value; break;
    }
    if (met) unlocked.push(achievement.id);
  }
  return unlocked;
}
