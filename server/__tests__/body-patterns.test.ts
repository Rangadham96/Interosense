import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getBodyPatternSummary } from '../../lib/body-patterns';
import { generateAdvisorState } from '../../lib/personalization-engine';
import type { BodyMark, CheckinRecord } from '../../lib/storage';

const NOW = new Date('2026-09-16T12:00:00.000Z');

describe('getBodyPatternSummary', () => {
  it('combines structured body-map and check-in reports without reading notes', () => {
    const bodyMarks: BodyMark[] = [
      {
        id: 'mark-1',
        x: 100,
        y: 124,
        region: 'Torso',
        intensity: 4,
        sensation: 'tension',
        createdAt: '2026-09-15T12:00:00.000Z',
        view: 'front',
      },
      {
        id: 'mark-2',
        x: 100,
        y: 124,
        region: 'Torso',
        intensity: 2,
        sensation: 'tension',
        createdAt: '2026-09-14T12:00:00.000Z',
        view: 'front',
      },
    ];
    const checkins: CheckinRecord[] = [
      {
        id: 'checkin-1',
        date: '2026-09-13T12:00:00.000Z',
        awarenessScore: 5,
        energyLevel: 5,
        sleepQuality: 5,
        stressLevel: 6,
        mood: 'neutral',
        sensations: ['tension'],
        bodyAreas: ['chest'],
        notes: 'Private note that must not be interpreted as structured pattern data.',
      },
    ];

    const summary = getBodyPatternSummary(bodyMarks, checkins, 30, NOW);

    assert.deepEqual(summary.topSensation, { value: 'tension', count: 3 });
    assert.deepEqual(summary.topRegion, { value: 'torso', count: 2 });
    assert.equal(summary.averageMappedIntensity, 3);
    assert.equal(summary.activeDays, 3);
    assert.equal(summary.totalReports, 3);
  });

  it('requires repetition before presenting a dominant pattern', () => {
    const checkins: CheckinRecord[] = [
      {
        id: 'checkin-1',
        date: '2026-09-15T12:00:00.000Z',
        awarenessScore: 5,
        energyLevel: 5,
        sleepQuality: 5,
        mood: 'neutral',
        sensations: ['warmth'],
        bodyAreas: ['hands'],
        notes: '',
      },
    ];

    const summary = getBodyPatternSummary([], checkins, 30, NOW);

    assert.equal(summary.topSensation, null);
    assert.equal(summary.topRegion, null);
    assert.equal(summary.totalReports, 1);
  });

  it('ignores reports outside the selected time window', () => {
    const oldMark: BodyMark = {
      id: 'old',
      x: 0,
      y: 0,
      region: 'Head',
      intensity: 5,
      sensation: 'pressure',
      createdAt: '2026-07-01T12:00:00.000Z',
      view: 'front',
    };

    const summary = getBodyPatternSummary([oldMark], [], 30, NOW);

    assert.equal(summary.totalReports, 0);
    assert.equal(summary.averageMappedIntensity, null);
  });
});

describe('connected body-pattern personalization', () => {
  it('turns a repeated mapped sensation into visible feedback and a transparent recommendation reason', () => {
    const bodyMarks: BodyMark[] = [
      {
        id: 'mark-1',
        x: 100,
        y: 124,
        region: 'Torso',
        intensity: 4,
        sensation: 'tension',
        createdAt: '2026-09-15T12:00:00.000Z',
        view: 'front',
      },
      {
        id: 'mark-2',
        x: 100,
        y: 124,
        region: 'Torso',
        intensity: 3,
        sensation: 'tension',
        createdAt: '2026-09-14T12:00:00.000Z',
        view: 'front',
      },
    ];

    const state = generateAdvisorState(
      null,
      [],
      [],
      [],
      false,
      0,
      0,
      [],
      bodyMarks,
    );

    assert.ok(state.insights.some(insight =>
      insight.id === 'body-signal-pattern' &&
      insight.body.includes('tension was recorded 2 times'),
    ));
    assert.ok(state.recommendations.some(recommendation =>
      recommendation.type === 'exercise' &&
      recommendation.reason.includes('repeatedly recorded tension') &&
      recommendation.reason.includes('torso'),
    ));
  });
});