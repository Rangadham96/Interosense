/**
 * Tests for the daily-insight cache-invalidation logic in getTodayInsight()
 * (server/storage.ts)
 *
 * Verifies two critical scenarios:
 *
 * Scenario A — Health disconnects mid-day after a wearable insight was cached:
 *   A wearable-enriched insight (has_wearable_context=true) is already stored.
 *   A subsequent request arrives WITHOUT wearable context.
 *   Expected: the cached wearable insight is returned — no regeneration,
 *             no second plain insight written to the DB.
 *
 * Scenario B — No cache exists, request arrives without wearable context:
 *   The DB has no insight for today.
 *   Expected: undefined → caller generates and saves has_wearable_context=false.
 *
 * Strategy:
 *   We mock db.select() to return a configurable list of rows. The mock is a
 *   minimal chainable builder that resolves synchronously (await [] === []).
 *   Each test sets `dbRows` to the rows the real DB *would* return for the
 *   given WHERE clause, so tests stay honest about what SQL would produce.
 *
 * Run: npm run test:server
 */

import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

// ── Env vars must be set before any module reads process.env ──────────────────
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_placeholder';
process.env.SESSION_SECRET = 'test-secret';

// ── Synthetic DB rows ─────────────────────────────────────────────────────────
const TODAY = '2026-07-12';
const USER_ID = 'user-test-insight-001';

type FakeInsight = {
  id: string;
  userId: string;
  insightText: string;
  generatedDate: string;
  hasWearableContext: boolean;
  createdAt: Date;
};

const WEARABLE_INSIGHT: FakeInsight = {
  id: 'ins-wearable-1',
  userId: USER_ID,
  insightText: 'Wearable-enriched: HRV looks great today.',
  generatedDate: TODAY,
  hasWearableContext: true,
  createdAt: new Date(),
};

const PLAIN_INSIGHT: FakeInsight = {
  id: 'ins-plain-1',
  userId: USER_ID,
  insightText: 'Plain insight without wearable data.',
  generatedDate: TODAY,
  hasWearableContext: false,
  createdAt: new Date(),
};

// ── DB mock ───────────────────────────────────────────────────────────────────
// dbRows controls what db.select().from().where() resolves to.
// Each test sets this to what the real DB *would* return after filtering.
let dbRows: FakeInsight[] = [];

function makeChainableBuilder(rows: FakeInsight[]) {
  // All methods return `this` until where() which resolves to the rows.
  // `await someArray` === `someArray` so this is compatible with:
  //   const [row] = await db.select().from(...).where(...)   (wearable branch)
  //   const rows  = await db.select().from(...).where(...)   (plain branch)
  const chain: any = { from: () => chain, where: () => rows };
  return chain;
}

import { db } from '../db';
(db as any).select = mock.fn(() => makeChainableBuilder(dbRows));

import { getTodayInsight } from '../storage';

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('getTodayInsight — wearable cache-invalidation logic', () => {

  // ── Scenario A: health disconnects after wearable insight was saved ─────────

  describe('Scenario A: wearable insight cached → health disconnects → request without wearable', () => {

    it('A1: returns the wearable insight when it is the only cached row (no regen triggered)', async () => {
      // DB returns the wearable row (no wearable-context filter is applied in this branch;
      // all today's rows for the user are fetched and the JS layer picks the best one).
      dbRows = [WEARABLE_INSIGHT];

      const result = await getTodayInsight(USER_ID, TODAY, false /* wearableContext absent */);

      assert.ok(result, 'should return a cached insight, not a cache miss');
      assert.equal(
        result.hasWearableContext,
        true,
        'must serve the richer wearable insight to prevent generating a stale plain one',
      );
      assert.equal(result.insightText, WEARABLE_INSIGHT.insightText);
    });

    it('A2: prefers the wearable insight when both wearable and plain rows exist', async () => {
      dbRows = [WEARABLE_INSIGHT, PLAIN_INSIGHT];

      const result = await getTodayInsight(USER_ID, TODAY, false);

      assert.ok(result, 'should return a cached insight');
      assert.equal(result.hasWearableContext, true, 'wearable insight should be preferred over plain');
    });

    it('A3: returns the plain insight when only a plain row exists (no wearable to prefer)', async () => {
      dbRows = [PLAIN_INSIGHT];

      const result = await getTodayInsight(USER_ID, TODAY, false);

      assert.ok(result, 'should return the plain cached insight');
      assert.equal(result.hasWearableContext, false);
    });

  });

  // ── Scenario B: no cache, request without wearable ─────────────────────────

  describe('Scenario B: no cached insight exists, request arrives without wearable context', () => {

    it('B1: returns undefined (cache miss) — caller saves has_wearable_context=false', async () => {
      // DB returns no rows for today.
      dbRows = [];

      const result = await getTodayInsight(USER_ID, TODAY, false);

      assert.equal(
        result,
        undefined,
        'cache miss must return undefined so the route handler generates and saves a plain insight',
      );
    });

  });

  // ── Guard: wearable context present → only serve wearable insights ──────────

  describe('Guard: when the request HAS wearable context', () => {

    it('G1: cache miss when only a plain insight exists → triggers wearable-aware regeneration', async () => {
      // Real DB would return [] because it filters WHERE has_wearable_context=true.
      // We simulate that filtered result here.
      dbRows = [];

      const result = await getTodayInsight(USER_ID, TODAY, true /* wearableContext present */);

      assert.equal(
        result,
        undefined,
        'a plain cached insight must be ignored when wearable data is available — force regeneration',
      );
    });

    it('G2: returns the wearable insight when it is already cached', async () => {
      // Real DB filters WHERE has_wearable_context=true → returns the wearable row.
      dbRows = [WEARABLE_INSIGHT];

      const result = await getTodayInsight(USER_ID, TODAY, true);

      assert.ok(result, 'should return the cached wearable insight');
      assert.equal(result.hasWearableContext, true);
      assert.equal(result.insightText, WEARABLE_INSIGHT.insightText);
    });

  });

});
