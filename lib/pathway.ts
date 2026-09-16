export const PATHWAY_VERSION = 1;

export const PATHWAY_SEQUENCE = [
  { day: 1, exerciseId: 'somatic-grounding', purpose: 'Begin with external and body-based anchors that feel manageable.' },
  { day: 2, exerciseId: 'diaphragmatic-breathing', purpose: 'Notice breath movement without forcing its pace or depth.' },
  { day: 3, exerciseId: 'quick-body-check', purpose: 'Practice naming a few sensations clearly and briefly.' },
  { day: 4, exerciseId: 'orienting-response', purpose: 'Move attention between the environment and body sensations.' },
  { day: 5, exerciseId: 'progressive-body-scan', purpose: 'Explore how attention changes across body regions.' },
  { day: 6, exerciseId: 'shoulder-check', purpose: 'Notice tension and experiment with a comfortable adjustment.' },
  { day: 7, exerciseId: 'breath-counting', purpose: 'Use counting as an optional anchor for sustained attention.' },
  { day: 8, exerciseId: 'box-breathing', purpose: 'Try a structured breath pattern only while it feels comfortable.' },
  { day: 9, exerciseId: 'temperature-awareness', purpose: 'Notice temperature as one body signal among many.' },
  { day: 10, exerciseId: 'slow-walking', purpose: 'Connect body awareness with gentle movement.' },
  { day: 11, exerciseId: 'heartbeat-detection', purpose: 'Explore heartbeat sensations without judging accuracy.' },
  { day: 12, exerciseId: 'tension-release', purpose: 'Compare tension and release without requiring relaxation.' },
  { day: 13, exerciseId: 'humming-vagal-activation', purpose: 'Notice vibration from humming as an optional sensory anchor.' },
  { day: 14, exerciseId: 'resourcing', purpose: 'Identify supportive sensations and review what was useful.' },
] as const;

export interface PathwayAttempt {
  id: string;
  day: number;
  exerciseId: string;
  completedAt: string;
  rating: number;
  beforeAwareness: number;
  beforeComfort: number;
  afterAwareness: number;
  afterComfort: number;
  outcome: 'advanced' | 'repeat' | 'support';
}

export interface PathwayState {
  version: typeof PATHWAY_VERSION;
  startedAt: string;
  updatedAt: string;
  currentDay: number;
  currentExerciseId: string;
  attempts: PathwayAttempt[];
  completedAt: string | null;
}

export interface PathwayResponse {
  exerciseId: string;
  rating: number;
  beforeAwareness: number;
  beforeComfort: number;
  afterAwareness: number;
  afterComfort: number;
  completedAt: string;
}

const SUPPORT_EXERCISE_ID = 'safety-anchoring';

export function createPathwayState(now = new Date()): PathwayState {
  const timestamp = now.toISOString();
  return {
    version: PATHWAY_VERSION,
    startedAt: timestamp,
    updatedAt: timestamp,
    currentDay: 1,
    currentExerciseId: PATHWAY_SEQUENCE[0].exerciseId,
    attempts: [],
    completedAt: null,
  };
}

export function normalizePathwayState(value: unknown): PathwayState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<PathwayState>;
  if (
    candidate.version !== PATHWAY_VERSION ||
    typeof candidate.startedAt !== 'string' ||
    typeof candidate.updatedAt !== 'string' ||
    typeof candidate.currentDay !== 'number' ||
    typeof candidate.currentExerciseId !== 'string' ||
    !Array.isArray(candidate.attempts)
  ) return null;
  return {
    ...candidate,
    completedAt: typeof candidate.completedAt === 'string' ? candidate.completedAt : null,
  } as PathwayState;
}

export function isCurrentPathwayExercise(state: PathwayState | null, exerciseId: string): boolean {
  return Boolean(state && !state.completedAt && state.currentExerciseId === exerciseId);
}

export function recordPathwayResponse(
  state: PathwayState,
  response: PathwayResponse,
): PathwayState {
  if (state.completedAt || response.exerciseId !== state.currentExerciseId) return state;

  const lowRating = response.rating <= 2;
  const lowComfort = response.afterComfort <= 3;
  const shouldRepeat = lowRating || lowComfort;
  const priorLowComfortAttempts = state.attempts.filter(
    attempt => attempt.day === state.currentDay && attempt.afterComfort <= 3,
  ).length;
  const shouldUseSupport =
    lowComfort &&
    priorLowComfortAttempts >= 1 &&
    response.exerciseId !== SUPPORT_EXERCISE_ID;
  const outcome: PathwayAttempt['outcome'] = shouldRepeat
    ? shouldUseSupport ? 'support' : 'repeat'
    : 'advanced';
  const attempt: PathwayAttempt = {
    id: `${response.completedAt}-${state.currentDay}-${state.attempts.length + 1}`,
    day: state.currentDay,
    ...response,
    outcome,
  };
  const attempts = [...state.attempts, attempt];

  if (shouldRepeat) {
    return {
      ...state,
      attempts,
      currentExerciseId: shouldUseSupport ? SUPPORT_EXERCISE_ID : state.currentExerciseId,
      updatedAt: response.completedAt,
    };
  }

  if (state.currentDay >= PATHWAY_SEQUENCE.length) {
    return {
      ...state,
      attempts,
      completedAt: response.completedAt,
      updatedAt: response.completedAt,
    };
  }

  const nextDay = state.currentDay + 1;
  return {
    ...state,
    attempts,
    currentDay: nextDay,
    currentExerciseId: PATHWAY_SEQUENCE[nextDay - 1].exerciseId,
    updatedAt: response.completedAt,
  };
}

export function getPathwayPurpose(state: PathwayState): string {
  return PATHWAY_SEQUENCE[state.currentDay - 1]?.purpose ?? 'Continue at a pace that feels manageable.';
}

export function getCompletedPathwayDays(state: PathwayState): number[] {
  return [...new Set(
    state.attempts.filter(attempt => attempt.outcome === 'advanced').map(attempt => attempt.day),
  )].sort((a, b) => a - b);
}