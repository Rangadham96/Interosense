/**
 * Regression tests for default goal seeding (constants/default-goals.ts).
 *
 * Key scenario (from code review): a returning user whose server-hydrated
 * history already satisfies starter goals must get defaults seeded WITH
 * current progress, marked completed AND celebrated, so no false completion
 * celebration fires after login.
 *
 * Run: npm run test:server
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_GOAL_PRESETS,
  buildDefaultGoals,
  createGoalFromPreset,
  getGoalProgress,
  getNextLevelPreset,
  makePreset,
  normalizeGoals,
  resolveServerGoalState,
  GoalStats,
} from '../../constants/default-goals';

const ZERO_STATS: GoalStats = {
  totalSessions: 0,
  currentStreak: 0,
  totalMinutes: 0,
  totalCheckins: 0,
  averageAwareness: 0,
};

// A returning user whose history already satisfies several starter goals.
const VETERAN_STATS: GoalStats = {
  totalSessions: 12,
  currentStreak: 4,
  totalMinutes: 85,
  totalCheckins: 7,
  averageAwareness: 5.5,
};

describe('buildDefaultGoals', () => {
  it('seeds the full curated set with zero progress for a brand-new user', () => {
    const goals = buildDefaultGoals([], ZERO_STATS);
    assert.equal(goals.length, DEFAULT_GOAL_PRESETS.length);
    for (const g of goals) {
      assert.equal(g.currentValue, 0, `${g.title} should start at 0`);
      assert.equal(g.completed, false);
      assert.equal(g.celebrated, false, 'incomplete goals must not be pre-celebrated');
      assert.ok(g.presetId, 'seeded goals must carry their presetId');
    }
  });

  it('seeds already-satisfied goals as completed AND celebrated for a returning user (no false celebration)', () => {
    const goals = buildDefaultGoals([], VETERAN_STATS);

    const byPreset = new Map(goals.map(g => [g.presetId, g]));
    const firstSession = byPreset.get('preset-sessions-1')!;
    const streak3 = byPreset.get('preset-streak-3')!;
    const checkins5 = byPreset.get('preset-checkins-5')!;
    const minutes30 = byPreset.get('preset-minutes-30')!;
    const awareness6 = byPreset.get('preset-awareness-6')!;

    // Progress must reflect the hydrated history, not zero.
    assert.equal(firstSession.currentValue, 12);
    assert.equal(streak3.currentValue, 4);
    assert.equal(checkins5.currentValue, 7);
    assert.equal(minutes30.currentValue, 85);
    assert.equal(awareness6.currentValue, 5.5);

    // Satisfied goals are completed and pre-celebrated: no celebration fires.
    for (const g of [firstSession, streak3, checkins5, minutes30]) {
      assert.equal(g.completed, true, `${g.title} should be completed`);
      assert.equal(g.celebrated, true, `${g.title} must be pre-celebrated to avoid a false celebration on login`);
    }

    // Unmet goal (awareness 5.5 < 6) stays open and uncelebrated.
    assert.equal(awareness6.completed, false);
    assert.equal(awareness6.celebrated, false);
  });

  it('never resurrects dismissed presets', () => {
    const dismissed = ['preset-minutes-30', 'preset-awareness-6'];
    const goals = buildDefaultGoals(dismissed, ZERO_STATS);
    assert.equal(goals.length, DEFAULT_GOAL_PRESETS.length - dismissed.length);
    for (const g of goals) {
      assert.ok(!dismissed.includes(g.presetId!), `${g.presetId} should have been excluded`);
    }
  });
});

describe('getGoalProgress', () => {
  it('maps every goal type to the matching stat', () => {
    assert.equal(getGoalProgress('sessions', VETERAN_STATS), 12);
    assert.equal(getGoalProgress('streak', VETERAN_STATS), 4);
    assert.equal(getGoalProgress('minutes', VETERAN_STATS), 85);
    assert.equal(getGoalProgress('checkins', VETERAN_STATS), 7);
    assert.equal(getGoalProgress('awareness', VETERAN_STATS), 5.5);
    assert.equal(getGoalProgress('unknown-type', VETERAN_STATS), 0);
  });
});

describe('getNextLevelPreset', () => {
  it('suggests the next step in each progression chain', () => {
    assert.equal(getNextLevelPreset('sessions', 1)?.targetValue, 5);
    assert.equal(getNextLevelPreset('streak', 3)?.targetValue, 7);
    assert.equal(getNextLevelPreset('checkins', 5)?.targetValue, 15);
    assert.equal(getNextLevelPreset('minutes', 30)?.targetValue, 90);
    assert.equal(getNextLevelPreset('awareness', 6)?.targetValue, 7);
  });

  it('returns null when the chain is exhausted', () => {
    assert.equal(getNextLevelPreset('streak', 30), null);
    assert.equal(getNextLevelPreset('awareness', 8), null);
  });

  it('skips past custom targets to the next sensible level', () => {
    // User created a custom 10-session goal; next suggestion is 15, not 5.
    assert.equal(getNextLevelPreset('sessions', 10)?.targetValue, 15);
  });
});

describe('resolveServerGoalState (account transition / legacy preferences)', () => {
  // Regression: a second user logging in on the same device must never
  // inherit the previous account's locally persisted goals or dismissals.
  // A successful preferences fetch is authoritative: absent fields mean
  // THIS user has none.
  it('resolves empty preferences to empty goals and dismissals', () => {
    const state = resolveServerGoalState({});
    assert.deepEqual(state.goals, []);
    assert.deepEqual(state.dismissedPresets, []);
  });

  it('resolves legacy preferences missing the new fields to empty values', () => {
    const state = resolveServerGoalState({ settings: { darkMode: true }, bodyMarks: [] });
    assert.deepEqual(state.goals, []);
    assert.deepEqual(state.dismissedPresets, []);
  });

  it('passes through this user\'s own server goals and dismissals', () => {
    const goal = createGoalFromPreset(makePreset('sessions', 5), VETERAN_STATS);
    const state = resolveServerGoalState({ goals: [goal], dismissedPresets: ['preset-minutes-30'] });
    assert.equal(state.goals.length, 1);
    assert.equal(state.goals[0].presetId, 'preset-sessions-5');
    assert.deepEqual(state.dismissedPresets, ['preset-minutes-30']);
  });

  it('marks legacy completed goals without a celebrated flag as celebrated (no celebration replay)', () => {
    const legacy = { id: 'g1', type: 'sessions', title: 'Old goal', targetValue: 1, currentValue: 1, completed: true, createdAt: '2025-01-01' } as any;
    const state = resolveServerGoalState({ goals: [legacy] });
    assert.equal(state.goals[0].celebrated, true);
  });

  it('ignores malformed goal fields instead of crashing', () => {
    const state = resolveServerGoalState({ goals: 'oops', dismissedPresets: 42 });
    assert.deepEqual(state.goals, []);
    assert.deepEqual(state.dismissedPresets, []);
  });
});

describe('normalizeGoals', () => {
  it('leaves incomplete and already-flagged goals untouched', () => {
    const open = { id: 'a', completed: false } as any;
    const flagged = { id: 'b', completed: true, celebrated: false } as any;
    const [n1, n2] = normalizeGoals([open, flagged]);
    assert.equal(n1.celebrated, undefined);
    assert.equal(n2.celebrated, false);
  });
});

describe('createGoalFromPreset', () => {
  it('generates unique ids for repeated goals of the same preset', () => {
    const preset = makePreset('sessions', 5);
    const a = createGoalFromPreset(preset, ZERO_STATS);
    const b = createGoalFromPreset(preset, ZERO_STATS);
    assert.notEqual(a.id, b.id);
    assert.equal(a.presetId, b.presetId);
  });
});
