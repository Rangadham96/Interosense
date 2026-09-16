import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  createPathwayState,
  getCompletedPathwayDays,
  PATHWAY_SEQUENCE,
  recordPathwayResponse,
} from '../../lib/pathway';

function response(
  exerciseId: string,
  overrides: Partial<Parameters<typeof recordPathwayResponse>[1]> = {},
) {
  return {
    exerciseId,
    rating: 4,
    beforeAwareness: 4,
    beforeComfort: 5,
    afterAwareness: 5,
    afterComfort: 6,
    completedAt: '2026-09-16T12:00:00.000Z',
    ...overrides,
  };
}

describe('14-day pathway progression', () => {
  it('advances only after a comfortable saved response', () => {
    const initial = createPathwayState(new Date('2026-09-16T10:00:00.000Z'));
    const next = recordPathwayResponse(initial, response(initial.currentExerciseId));

    assert.equal(next.currentDay, 2);
    assert.equal(next.currentExerciseId, PATHWAY_SEQUENCE[1].exerciseId);
    assert.deepEqual(getCompletedPathwayDays(next), [1]);
    assert.equal(next.attempts[0].outcome, 'advanced');
  });

  it('repeats after a low-comfort response and offers a gentler support practice after a second one', () => {
    const initial = createPathwayState(new Date('2026-09-16T10:00:00.000Z'));
    const firstLow = recordPathwayResponse(
      initial,
      response(initial.currentExerciseId, {
        rating: 2,
        afterComfort: 2,
        completedAt: '2026-09-16T12:00:00.000Z',
      }),
    );

    assert.equal(firstLow.currentDay, 1);
    assert.equal(firstLow.currentExerciseId, initial.currentExerciseId);
    assert.equal(firstLow.attempts[0].outcome, 'repeat');

    const secondLow = recordPathwayResponse(
      firstLow,
      response(firstLow.currentExerciseId, {
        rating: 2,
        afterComfort: 3,
        completedAt: '2026-09-17T12:00:00.000Z',
      }),
    );

    assert.equal(secondLow.currentDay, 1);
    assert.equal(secondLow.currentExerciseId, 'safety-anchoring');
    assert.equal(secondLow.attempts[1].outcome, 'support');

    const afterSupport = recordPathwayResponse(
      secondLow,
      response('safety-anchoring', {
        completedAt: '2026-09-18T12:00:00.000Z',
      }),
    );
    assert.equal(afterSupport.currentDay, 2);
  });

  it('does not advance for an exercise that is not the current pathway practice', () => {
    const initial = createPathwayState(new Date('2026-09-16T10:00:00.000Z'));
    const unchanged = recordPathwayResponse(initial, response('box-breathing'));

    assert.deepEqual(unchanged, initial);
  });

  it('does not use awareness change as a difficulty or safety gate', () => {
    const initial = createPathwayState(new Date('2026-09-16T10:00:00.000Z'));
    const next = recordPathwayResponse(
      initial,
      response(initial.currentExerciseId, {
        beforeAwareness: 9,
        afterAwareness: 2,
        afterComfort: 6,
      }),
    );

    assert.equal(next.currentDay, 2);
    assert.equal(next.attempts[0].outcome, 'advanced');
  });

  it('only switches to the support practice after repeated low comfort', () => {
    const initial = createPathwayState(new Date('2026-09-16T10:00:00.000Z'));
    const firstLowRating = recordPathwayResponse(
      initial,
      response(initial.currentExerciseId, { rating: 2, afterComfort: 7 }),
    );
    const secondLowRating = recordPathwayResponse(
      firstLowRating,
      response(firstLowRating.currentExerciseId, {
        rating: 2,
        afterComfort: 7,
        completedAt: '2026-09-17T12:00:00.000Z',
      }),
    );

    assert.equal(secondLowRating.currentExerciseId, initial.currentExerciseId);
    assert.equal(secondLowRating.attempts[1].outcome, 'repeat');
  });

  it('completes after all fourteen days without using calendar streaks', () => {
    let state = createPathwayState(new Date('2026-09-01T10:00:00.000Z'));

    for (let index = 0; index < PATHWAY_SEQUENCE.length; index++) {
      state = recordPathwayResponse(
        state,
        response(state.currentExerciseId, {
          completedAt: `2026-09-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
        }),
      );
    }

    assert.ok(state.completedAt);
    assert.equal(state.currentDay, 14);
    assert.equal(getCompletedPathwayDays(state).length, 14);
  });
});