/**
 * Tests for the premium subscription lifecycle routes:
 *   POST /api/razorpay/cancel   — schedules cancel_at_cycle_end and persists intent
 *   POST /api/razorpay/resume   — removes scheduled cancellation and clears intent
 *   GET  /api/razorpay/subscription-status — live state, plus local fallback when
 *        the Razorpay fetch fails (stale flag, cancelled status for ended subs)
 *
 * Strategy: patch the shared storage singleton (getUser/updateUser) and stub the
 * Razorpay client factory before importing the router. No real DB or network.
 *
 * Run: npm run test:server
 */

import { describe, it, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import express, { type Application } from 'express';

// ── Env vars must be set before any module that reads them is loaded ──────────
process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_placeholder';

const TEST_USER_ID = 'user-lifecycle-1';
const TEST_SUB_ID = 'sub_LIFECYCLE_1';

// ── Patch storage via the shared singleton ─────────────────────────────────────
import { storage } from '../storage';

let fakeUser: Record<string, unknown> | undefined;

const getUserMock = mock.fn(async (_id: string) => fakeUser as any);
const updateUserMock = mock.fn(async (_id: string, data: Record<string, unknown>) => {
  fakeUser = { ...(fakeUser ?? {}), ...data };
  return fakeUser as any;
});
(storage as any).getUser = getUserMock;
(storage as any).updateUser = updateUserMock;

// ── Stub the razorpay package before the router (and razorpayClient) load it ──
// getRazorpayClient() constructs `new Razorpay(...)` per call, so replacing the
// package's export in the require cache makes every client use our stub.
// NOTE: static `import` statements are hoisted above this code, so the router
// MUST be loaded lazily (see loadRouter) — after this patch has run.
let subscriptionsStub: Record<string, any> = {};

class FakeRazorpay {
  subscriptions: Record<string, any>;
  constructor(_opts: unknown) {
    this.subscriptions = subscriptionsStub;
  }
}
(FakeRazorpay as any).default = FakeRazorpay;

function patchRazorpayModule() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const razorpayPath = require.resolve('razorpay');
  require(razorpayPath);
  require.cache[razorpayPath]!.exports = FakeRazorpay;
}

function loadRouter() {
  patchRazorpayModule();
  // Lazy require so the razorpay stub is in place before razorpayClient loads
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../razorpayRoutes');
  return mod.default ?? mod;
}

function buildApp(): Application {
  const app = express();
  app.use(express.json());
  // Simulate an authenticated session
  app.use((req: any, _res, next) => {
    req.session = { userId: TEST_USER_ID };
    next();
  });
  app.use(loadRouter());
  return app;
}

const PERIOD_END_UNIX = 1_789_000_000; // some future unix ts
const PERIOD_END_ISO = new Date(PERIOD_END_UNIX * 1000).toISOString();

describe('Premium lifecycle: cancel → pending cancellation → resume', () => {
  let request: any;

  before(async () => {
    const supertest = (await import('supertest')).default;
    request = supertest(buildApp());
  });

  beforeEach(() => {
    getUserMock.mock.resetCalls();
    updateUserMock.mock.resetCalls();
    fakeUser = {
      id: TEST_USER_ID,
      isPremium: true,
      razorpaySubscriptionId: TEST_SUB_ID,
      razorpayCancelAtCycleEnd: false,
      razorpayCurrentEnd: null,
    };
    subscriptionsStub = {};
  });

  it('cancel schedules cancel_at_cycle_end and persists intent locally', async () => {
    const cancelSpy = mock.fn(async (_subId: string, _opts: any) => ({
      id: TEST_SUB_ID,
      status: 'active',
      cancel_at_cycle_end: 1,
      current_end: PERIOD_END_UNIX,
    }));
    subscriptionsStub.cancel = cancelSpy;

    const res = await request.post('/api/razorpay/cancel').send({});

    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.success, true);
    assert.equal(cancelSpy.mock.callCount(), 1);
    assert.deepEqual(cancelSpy.mock.calls[0].arguments[1], { cancel_at_cycle_end: 1 });

    // Intent persisted locally
    assert.equal(fakeUser?.razorpayCancelAtCycleEnd, true);
    assert.equal(fakeUser?.razorpayCurrentEnd, PERIOD_END_ISO);
    // Access is kept until the period ends
    assert.equal(fakeUser?.isPremium, true);
  });

  it('cancel without a stored subscription returns 400', async () => {
    fakeUser = { id: TEST_USER_ID, isPremium: false, razorpaySubscriptionId: null };

    const res = await request.post('/api/razorpay/cancel').send({});

    assert.equal(res.status, 400);
    assert.equal(updateUserMock.mock.callCount(), 0);
  });

  it('resume removes the scheduled cancellation and clears local intent', async () => {
    fakeUser!.razorpayCancelAtCycleEnd = true;
    fakeUser!.razorpayCurrentEnd = PERIOD_END_ISO;

    const resumeSpy = mock.fn(async (_subId: string) => ({
      id: TEST_SUB_ID,
      status: 'active',
      cancel_at_cycle_end: 0,
    }));
    subscriptionsStub.cancelScheduledChanges = resumeSpy;

    const res = await request.post('/api/razorpay/resume').send({});

    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.success, true);
    assert.equal(resumeSpy.mock.callCount(), 1);
    assert.equal(resumeSpy.mock.calls[0].arguments[0], TEST_SUB_ID);
    assert.equal(fakeUser?.razorpayCancelAtCycleEnd, false);
  });

  it('resume without a stored subscription returns 400', async () => {
    fakeUser = { id: TEST_USER_ID, isPremium: false, razorpaySubscriptionId: null };

    const res = await request.post('/api/razorpay/resume').send({});

    assert.equal(res.status, 400);
    assert.equal(updateUserMock.mock.callCount(), 0);
  });

  it('resume surfaces a Razorpay failure as 500 and keeps local intent unchanged', async () => {
    fakeUser!.razorpayCancelAtCycleEnd = true;
    subscriptionsStub.cancelScheduledChanges = mock.fn(async () => {
      throw new Error('no scheduled changes');
    });

    const res = await request.post('/api/razorpay/resume').send({});

    assert.equal(res.status, 500);
    assert.equal(updateUserMock.mock.callCount(), 0, 'local intent must not change on failure');
    assert.equal(fakeUser?.razorpayCancelAtCycleEnd, true);
  });
});

describe('GET /api/razorpay/subscription-status', () => {
  let request: any;

  before(async () => {
    const supertest = (await import('supertest')).default;
    request = supertest(buildApp());
  });

  beforeEach(() => {
    getUserMock.mock.resetCalls();
    updateUserMock.mock.resetCalls();
    fakeUser = {
      id: TEST_USER_ID,
      isPremium: true,
      razorpaySubscriptionId: TEST_SUB_ID,
      razorpayCancelAtCycleEnd: false,
      razorpayCurrentEnd: null,
    };
    subscriptionsStub = {};
  });

  it('returns null subscription when the user has none', async () => {
    fakeUser = { id: TEST_USER_ID, isPremium: false, razorpaySubscriptionId: null };

    const res = await request.get('/api/razorpay/subscription-status');

    assert.equal(res.status, 200);
    assert.equal(res.body.subscription, null);
  });

  it('reports live state including cancelAtCycleEnd from Razorpay', async () => {
    subscriptionsStub.fetch = mock.fn(async () => ({
      id: TEST_SUB_ID,
      status: 'active',
      cancel_at_cycle_end: 1,
      current_end: PERIOD_END_UNIX,
      notes: { plan: 'annual' },
    }));

    const res = await request.get('/api/razorpay/subscription-status');

    assert.equal(res.status, 200);
    assert.equal(res.body.subscription.status, 'active');
    assert.equal(res.body.subscription.cancelAtCycleEnd, true);
    assert.equal(res.body.subscription.plan, 'Annual');
    assert.equal(res.body.subscription.currentEnd, PERIOD_END_ISO);
  });

  it('falls back to locally persisted intent when the live fetch fails (still premium)', async () => {
    fakeUser!.razorpayCancelAtCycleEnd = true;
    fakeUser!.razorpayCurrentEnd = PERIOD_END_ISO;
    subscriptionsStub.fetch = mock.fn(async () => {
      throw new Error('razorpay unreachable');
    });

    const res = await request.get('/api/razorpay/subscription-status');

    assert.equal(res.status, 200);
    assert.equal(res.body.subscription.stale, true);
    assert.equal(res.body.subscription.status, 'active');
    assert.equal(res.body.subscription.cancelAtCycleEnd, true);
    assert.equal(res.body.subscription.currentEnd, PERIOD_END_ISO);
  });

  it('falls back to cancelled status when the live fetch fails and premium has ended', async () => {
    fakeUser!.isPremium = false;
    fakeUser!.razorpayCancelAtCycleEnd = false;
    subscriptionsStub.fetch = mock.fn(async () => {
      throw new Error('razorpay unreachable');
    });

    const res = await request.get('/api/razorpay/subscription-status');

    assert.equal(res.status, 200);
    assert.equal(res.body.subscription.stale, true);
    assert.equal(res.body.subscription.status, 'cancelled');
  });
});

describe('POST /api/razorpay/verify-payment — fresh purchase after ended subscription', () => {
  let request: any;

  before(async () => {
    const supertest = (await import('supertest')).default;
    request = supertest(buildApp());
  });

  beforeEach(() => {
    updateUserMock.mock.resetCalls();
    // User whose previous subscription ended (buy-again scenario)
    fakeUser = {
      id: TEST_USER_ID,
      isPremium: false,
      razorpaySubscriptionId: 'sub_OLD_ENDED',
      razorpayCancelAtCycleEnd: true,
      razorpayCurrentEnd: PERIOD_END_ISO,
    };
    subscriptionsStub = {
      fetch: mock.fn(async () => ({ id: 'sub_NEW_1', customer_id: 'cust_REAL_1' })),
    };
  });

  function signPayment(paymentId: string, subscriptionId: string): string {
    const crypto = require('node:crypto');
    return crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${paymentId}|${subscriptionId}`)
      .digest('hex');
  }

  it('activates premium, stores the new subscription ID and real customer ID, and clears cancellation intent', async () => {
    const res = await request.post('/api/razorpay/verify-payment').send({
      razorpay_payment_id: 'pay_NEW_1',
      razorpay_subscription_id: 'sub_NEW_1',
      razorpay_signature: signPayment('pay_NEW_1', 'sub_NEW_1'),
    });

    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.success, true);

    assert.equal(fakeUser?.isPremium, true);
    assert.equal(fakeUser?.razorpaySubscriptionId, 'sub_NEW_1');
    // Customer ID must be the real customer id, never the subscription id
    assert.equal(fakeUser?.razorpayCustomerId, 'cust_REAL_1');
    assert.notEqual(fakeUser?.razorpayCustomerId, fakeUser?.razorpaySubscriptionId);
    // A fresh purchase clears any previous cancellation intent
    assert.equal(fakeUser?.razorpayCancelAtCycleEnd, false);
    assert.equal(fakeUser?.razorpayCurrentEnd, null);
    // It also starts a fresh webhook-ordering chain for the new subscription.
    assert.equal(fakeUser?.razorpaySubscriptionStatus, 'created');
    assert.equal(fakeUser?.razorpayLastWebhookAt, null);
    assert.equal(fakeUser?.razorpayLastWebhookEventId, null);
  });

  it('rejects an invalid signature without touching the user', async () => {
    const res = await request.post('/api/razorpay/verify-payment').send({
      razorpay_payment_id: 'pay_NEW_1',
      razorpay_subscription_id: 'sub_NEW_1',
      razorpay_signature: 'not-a-valid-signature',
    });

    assert.equal(res.status, 400);
    assert.equal(updateUserMock.mock.callCount(), 0);
    assert.equal(fakeUser?.isPremium, false);
  });
});
