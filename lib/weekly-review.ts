import type { CheckinRecord, SessionRecord } from '@/lib/storage';
import type { PathwayState } from '@/lib/pathway';

export type WeeklyMetricKey = 'clarity' | 'comfort' | 'recovery' | 'helpfulness';
export type WeeklyMetricTrend = 'higher' | 'steady' | 'lower' | 'baseline' | 'missing';

export interface WeeklyMetric {
  key: WeeklyMetricKey;
  label: string;
  scale: number;
  currentAverage: number | null;
  previousAverage: number | null;
  currentCount: number;
  previousCount: number;
  trend: WeeklyMetricTrend;
  source: string;
}

export interface WeeklyReview {
  currentStart: string;
  previousStart: string;
  metrics: WeeklyMetric[];
  hasCurrentData: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function inWindow(timestamp: string, start: number, end: number): boolean {
  const value = Date.parse(timestamp);
  return Number.isFinite(value) && value > start && value <= end;
}

function buildMetric(
  key: WeeklyMetricKey,
  label: string,
  scale: number,
  currentValues: number[],
  previousValues: number[],
  source: string,
): WeeklyMetric {
  const currentAverage = average(currentValues);
  const previousAverage = average(previousValues);
  const threshold = scale === 5 ? 0.25 : 0.5;
  let trend: WeeklyMetricTrend = 'missing';
  if (currentAverage !== null && previousAverage === null) trend = 'baseline';
  if (currentAverage !== null && previousAverage !== null) {
    const difference = currentAverage - previousAverage;
    trend = Math.abs(difference) < threshold ? 'steady' : difference > 0 ? 'higher' : 'lower';
  }
  return {
    key,
    label,
    scale,
    currentAverage,
    previousAverage,
    currentCount: currentValues.length,
    previousCount: previousValues.length,
    trend,
    source,
  };
}

export function buildWeeklyReview(
  pathway: PathwayState | null,
  sessions: SessionRecord[],
  checkins: CheckinRecord[],
  now = new Date(),
): WeeklyReview {
  const end = now.getTime();
  const currentStart = end - 7 * DAY_MS;
  const previousStart = end - 14 * DAY_MS;
  const attempts = pathway?.attempts ?? [];
  const currentAttempts = attempts.filter(attempt => inWindow(attempt.completedAt, currentStart, end));
  const previousAttempts = attempts.filter(attempt => inWindow(attempt.completedAt, previousStart, currentStart));
  const currentCheckins = checkins.filter(checkin => inWindow(checkin.date, currentStart, end));
  const previousCheckins = checkins.filter(checkin => inWindow(checkin.date, previousStart, currentStart));
  const currentSessions = sessions.filter(session => inWindow(session.completedAt, currentStart, end));
  const previousSessions = sessions.filter(session => inWindow(session.completedAt, previousStart, currentStart));

  const metrics = [
    buildMetric(
      'clarity',
      'Sensation clarity',
      10,
      currentAttempts.map(attempt => attempt.afterAwareness),
      previousAttempts.map(attempt => attempt.afterAwareness),
      'After-practice pathway response',
    ),
    buildMetric(
      'comfort',
      'Comfort with sensations',
      10,
      currentAttempts.map(attempt => attempt.afterComfort),
      previousAttempts.map(attempt => attempt.afterComfort),
      'After-practice pathway response',
    ),
    buildMetric(
      'recovery',
      'Recovery after stress',
      10,
      currentCheckins.flatMap(checkin => typeof checkin.recoveryAfterStress === 'number' ? [checkin.recoveryAfterStress] : []),
      previousCheckins.flatMap(checkin => typeof checkin.recoveryAfterStress === 'number' ? [checkin.recoveryAfterStress] : []),
      'Daily check-in response',
    ),
    buildMetric(
      'helpfulness',
      'Practice helpfulness',
      5,
      currentSessions.flatMap(session => session.rating > 0 ? [session.rating] : []),
      previousSessions.flatMap(session => session.rating > 0 ? [session.rating] : []),
      'Exercise rating',
    ),
  ];

  return {
    currentStart: new Date(currentStart).toISOString(),
    previousStart: new Date(previousStart).toISOString(),
    metrics,
    hasCurrentData: metrics.some(metric => metric.currentAverage !== null),
  };
}