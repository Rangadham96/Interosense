import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createPathwayState, type PathwayState } from '../../lib/pathway';
import { buildWeeklyReview } from '../../lib/weekly-review';
import type { CheckinRecord, SessionRecord } from '../../lib/storage';

const now = new Date('2026-09-17T12:00:00.000Z');

describe('weekly useful-change review', () => {
  it('compares direct user responses across rolling seven-day windows', () => {
    const pathway: PathwayState = {
      ...createPathwayState(new Date('2026-09-01T12:00:00.000Z')),
      attempts: [
        {
          id: 'old', day: 1, exerciseId: 'somatic-grounding',
          completedAt: '2026-09-07T12:00:00.000Z', rating: 3,
          beforeAwareness: 4, beforeComfort: 4, afterAwareness: 5, afterComfort: 4,
          outcome: 'advanced',
        },
        {
          id: 'new', day: 2, exerciseId: 'diaphragmatic-breathing',
          completedAt: '2026-09-14T12:00:00.000Z', rating: 4,
          beforeAwareness: 5, beforeComfort: 5, afterAwareness: 7, afterComfort: 6,
          outcome: 'advanced',
        },
      ],
    };
    const checkins = [
      checkin('old-checkin', '2026-09-07T12:00:00.000Z', 4),
      checkin('new-checkin', '2026-09-14T12:00:00.000Z', 7),
    ];
    const sessions = [
      session('old-session', '2026-09-07T12:00:00.000Z', 3),
      session('new-session', '2026-09-14T12:00:00.000Z', 4),
    ];

    const review = buildWeeklyReview(pathway, sessions, checkins, now);

    assert.equal(review.metrics.find(metric => metric.key === 'clarity')?.trend, 'higher');
    assert.equal(review.metrics.find(metric => metric.key === 'comfort')?.currentAverage, 6);
    assert.equal(review.metrics.find(metric => metric.key === 'recovery')?.previousAverage, 4);
    assert.equal(review.metrics.find(metric => metric.key === 'helpfulness')?.scale, 5);
  });

  it('reports missing metrics instead of inferring values', () => {
    const review = buildWeeklyReview(null, [], [], now);

    assert.equal(review.hasCurrentData, false);
    assert.ok(review.metrics.every(metric => metric.trend === 'missing'));
  });
});

function checkin(id: string, date: string, recoveryAfterStress: number): CheckinRecord {
  return {
    id, date, recoveryAfterStress, awarenessScore: 5, energyLevel: 5,
    sleepQuality: 5, stressLevel: 5, mood: 'neutral', sensations: [], bodyAreas: [], notes: '',
  };
}

function session(id: string, completedAt: string, rating: number): SessionRecord {
  return {
    id, completedAt, rating, exerciseId: 'quick-body-check', exerciseTitle: 'Quick Body Check',
    category: 'bodyScanning', durationMinutes: 3, notes: '',
  };
}