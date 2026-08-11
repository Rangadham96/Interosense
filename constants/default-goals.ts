import type { Goal } from '@/lib/storage';

export type GoalType = Goal['type'];

export interface GoalStats {
  totalSessions: number;
  currentStreak: number;
  totalMinutes: number;
  totalCheckins: number;
  averageAwareness: number;
}

export interface GoalPreset {
  presetId: string;
  type: GoalType;
  targetValue: number;
  title: string;
}

/**
 * Progressive target chains per goal type. When a goal at one target
 * completes, the next value in the chain becomes the suggested follow-up.
 */
const PROGRESSION_CHAINS: Record<GoalType, number[]> = {
  sessions: [1, 5, 15, 30, 60],
  streak: [3, 7, 14, 30],
  minutes: [30, 90, 180, 360],
  checkins: [5, 15, 30, 60],
  awareness: [6, 7, 8],
};

function titleFor(type: GoalType, target: number): string {
  switch (type) {
    case 'sessions':
      return target === 1 ? 'Complete your first session' : `Complete ${target} sessions`;
    case 'streak':
      return target === 3 ? 'Practice 3 days in a row' : `Keep a ${target} day streak`;
    case 'minutes':
      return `Reach ${target} minutes of practice`;
    case 'checkins':
      return `Complete ${target} body check-ins`;
    case 'awareness':
      return `Reach an average awareness of ${target}`;
  }
}

export function makePreset(type: GoalType, targetValue: number): GoalPreset {
  return {
    presetId: `preset-${type}-${targetValue}`,
    type,
    targetValue,
    title: titleFor(type, targetValue),
  };
}

/** The curated starter set every user begins with. */
export const DEFAULT_GOAL_PRESETS: GoalPreset[] = [
  makePreset('sessions', 1),
  makePreset('streak', 3),
  makePreset('checkins', 5),
  makePreset('minutes', 30),
  makePreset('awareness', 6),
];

/** Live progress for a goal type from current app stats. */
export function getGoalProgress(type: string, stats: GoalStats): number {
  switch (type) {
    case 'sessions': return stats.totalSessions;
    case 'streak': return stats.currentStreak;
    case 'minutes': return stats.totalMinutes;
    case 'checkins': return stats.totalCheckins;
    case 'awareness': return stats.averageAwareness;
    default: return 0;
  }
}

/**
 * The next-level preset after completing a goal of the given type/target,
 * or null when the chain is exhausted or no sensible next step exists.
 */
export function getNextLevelPreset(type: GoalType, completedTarget: number): GoalPreset | null {
  const chain = PROGRESSION_CHAINS[type];
  if (!chain) return null;
  const next = chain.find(t => t > completedTarget);
  return next === undefined ? null : makePreset(type, next);
}

/**
 * Goals saved before the celebration flag existed: treat already-completed
 * ones as celebrated so users are not spammed with old completions.
 */
export function normalizeGoals(goals: Goal[]): Goal[] {
  return goals.map(g => (g.completed && g.celebrated === undefined) ? { ...g, celebrated: true } : g);
}

/**
 * Resolve the authenticated user's goal state from a SUCCESSFULLY fetched
 * server preferences object. Absent fields mean the user has no goals /
 * dismissals on the server (new account or legacy record), so they resolve
 * to empty rather than leaving a previous account's local values in place.
 * Callers must not invoke this on a failed fetch: offline fallback keeps
 * local state instead.
 */
export function resolveServerGoalState(preferences: Record<string, unknown>): { goals: Goal[]; dismissedPresets: string[] } {
  return {
    goals: Array.isArray(preferences.goals) ? normalizeGoals(preferences.goals as Goal[]) : [],
    dismissedPresets: Array.isArray(preferences.dismissedPresets) ? preferences.dismissedPresets as string[] : [],
  };
}

/**
 * Build the default goal set for a user with no goals, skipping presets the
 * user has dismissed. Stats must be the CURRENT activity (post server
 * hydration): goals already satisfied by history are seeded as completed and
 * celebrated so returning users see honest progress and no false celebration.
 */
export function buildDefaultGoals(dismissedPresetIds: string[], stats: GoalStats): Goal[] {
  return DEFAULT_GOAL_PRESETS
    .filter(p => !dismissedPresetIds.includes(p.presetId))
    .map(p => createGoalFromPreset(p, stats));
}

/** Build a Goal record from a preset, marking already-satisfied goals as celebrated. */
export function createGoalFromPreset(preset: GoalPreset, stats?: GoalStats): Goal {
  const current = stats ? getGoalProgress(preset.type, stats) : 0;
  const completed = current >= preset.targetValue;
  return {
    id: `${preset.presetId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    presetId: preset.presetId,
    title: preset.title,
    type: preset.type,
    targetValue: preset.targetValue,
    currentValue: current,
    createdAt: new Date().toISOString(),
    completed,
    // Do not celebrate goals that were already met before they existed.
    celebrated: completed,
  };
}
