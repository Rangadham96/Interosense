import type { BodyMark, CheckinRecord } from '@/lib/storage';

export interface PatternValue {
  value: string;
  count: number;
}

export interface BodyPatternSummary {
  windowDays: number;
  totalReports: number;
  activeDays: number;
  topRegion: PatternValue | null;
  topSensation: PatternValue | null;
  averageMappedIntensity: number | null;
}

function normalizeLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function findMostCommon(values: string[]): PatternValue | null {
  const counts = new Map<string, number>();
  for (const rawValue of values) {
    const value = normalizeLabel(rawValue);
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
  if (sorted.length === 0 || sorted[0][1] < 2) return null;
  return { value: sorted[0][0], count: sorted[0][1] };
}

function isWithinWindow(dateValue: string, cutoff: number): boolean {
  const timestamp = new Date(dateValue).getTime();
  return Number.isFinite(timestamp) && timestamp >= cutoff;
}

function dateKey(dateValue: string): string {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function getBodyPatternSummary(
  bodyMarks: BodyMark[],
  checkins: CheckinRecord[],
  windowDays = 30,
  now = new Date(),
): BodyPatternSummary {
  const cutoff = now.getTime() - windowDays * 24 * 60 * 60 * 1000;
  const recentMarks = bodyMarks.filter(mark => isWithinWindow(mark.createdAt, cutoff));
  const recentCheckins = checkins.filter(checkin => isWithinWindow(checkin.date, cutoff));

  const regions = [
    ...recentMarks.map(mark => mark.region),
    ...recentCheckins.flatMap(checkin => checkin.bodyAreas ?? []),
  ];
  const sensations = [
    ...recentMarks.map(mark => mark.sensation),
    ...recentCheckins.flatMap(checkin => checkin.sensations ?? []),
  ];
  const activeDates = new Set([
    ...recentMarks.map(mark => dateKey(mark.createdAt)),
    ...recentCheckins
      .filter(checkin => (checkin.bodyAreas?.length ?? 0) > 0 || (checkin.sensations?.length ?? 0) > 0)
      .map(checkin => dateKey(checkin.date)),
  ]);

  const averageMappedIntensity = recentMarks.length > 0
    ? Math.round(
        (recentMarks.reduce((sum, mark) => sum + mark.intensity, 0) / recentMarks.length) * 10,
      ) / 10
    : null;

  return {
    windowDays,
    totalReports: recentMarks.length + recentCheckins.filter(
      checkin => (checkin.bodyAreas?.length ?? 0) > 0 || (checkin.sensations?.length ?? 0) > 0,
    ).length,
    activeDays: activeDates.size,
    topRegion: findMostCommon(regions),
    topSensation: findMostCommon(sensations),
    averageMappedIntensity,
  };
}

export function formatPatternLabel(value: string): string {
  return value.replace(/\b\w/g, letter => letter.toUpperCase());
}