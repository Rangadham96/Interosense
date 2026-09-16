/**
 * Tests for POST /api/razorpay/webhook
 *
 * Verifies that:
 * - A forged request (wrong/missing signature) is rejected with 401 and no DB update
 * - A correctly HMAC-signed subscription.charged event grants premium (200 + isPremium=true)
 * - A correctly HMAC-signed subscription.halted event revokes premium (200 + isPremium=false)
 *
 * Strategy: import the real storage singleton, replace updateUser with a tracked mock fn,
 * then import the router (which shares the same singleton reference via Node's module cache).
 * No real DB queries are ever made because pg.Pool connects lazily.
 *
 * Run: npm run test:server
 */

import { describe, it, before, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express, { type Application } from 'express';

// ── Env vars must be set before any module that reads them is loaded ────────────
const WEBHOOK_SECRET = 'test-webhook-secret-xyz';
process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_placeholder';

const TEST_USER_ID = '99';
const TEST_SUB_ID = 'sub_TESTONLY';

// ── Patch storage.updateUser via the shared singleton ──────────────────────────
// Importing storage here causes Node to cache the module.
// razorpayRoutes.ts imports the same module → gets the same object reference.
// Replacing updateUser on the object therefore affects the router too.
import { storage } from '../storage';

let fakeUser: Record<string, unknown> = {
  id: TEST_USER_ID,
  isPremium: true,
  razorpaySubscriptionId: TEST_SUB_ID,
  razorpaySubscriptionStatus: 'active',
};

const getUserMock = mock.fn(async (_id: string) => fakeUser as any);
const updateUserMock = mock.fn(async (_id: string, data: Record<string, unknown>) => {
  fakeUser = { ...fakeUser, ...data };
  return fakeUser as any;
});
(storage as any).getUser = getUserMock;
(storage as any).updateUser = updateUserMock;

// ── Import router AFTER patching (Node module cache ensures shared reference) ──
import razorpayRouter from '../razorpayRoutes';

// ── Test app factory ────────────────────────────────────────────────────────────
function buildApp(): Application {
  const app = express();
  // Mirror the rawBody capture in production server/index.ts
  app.use(
    express.json({
      verify: (req: any, _res, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(razorpayRouter);
  return app;
}

// ── HMAC helpers ────────────────────────────────────────────────────────────────
function makeSignature(body: string, secret = WEBHOOK_SECRET): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function webhookPayload(eventName: string, options: {
  id?: string;
  createdAt?: number;
  subscriptionId?: string;
} = {}) {
  return {
    ...(options.id ? { id: options.id } : {}),
    ...(options.createdAt ? { created_at: options.createdAt } : {}),
    event: eventName,
    payload: {
      subscription: {
        entity: {
          id: options.subscriptionId ?? TEST_SUB_ID,
          notes: { userId: TEST_USER_ID },
        },
      },
    },
  };
}

// ── Test suite ──────────────────────────────────────────────────────────────────
describe('POST /api/razorpay/webhook — signature guard', () => {
  // supertest is imported dynamically to stay compatible with CJS + tsx
  let supertestRequest: any;

  before(async () => {
    const supertest = (await import('supertest')).default;
    supertestRequest = supertest(buildApp());
  });

  beforeEach(() => {
    updateUserMock.mock.resetCalls();
    getUserMock.mock.resetCalls();
    fakeUser = {
      id: TEST_USER_ID,
      isPremium: true,
      razorpaySubscriptionId: TEST_SUB_ID,
      razorpaySubscriptionStatus: 'active',
    };
  });

  // ── Forged / bad-signature cases ────────────────────────────────────────────

  it('rejects a request with no signature header → 401', async () => {
    const body = JSON.stringify(webhookPayload('subscription.charged'));

    const res = await supertestRequest
      .post('/api/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .send(body);

    assert.equal(res.status, 401, `expected 401, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(updateUserMock.mock.callCount(), 0, 'updateUser must NOT be called with bad signature');
  });

  it('rejects a request with a wrong signature → 401', async () => {
    const body = JSON.stringify(webhookPayload('subscription.charged'));
    const badSig = makeSignature(body, 'totally-wrong-secret');

    const res = await supertestRequest
      .post('/api/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', badSig)
      .send(body);

    assert.equal(res.status, 401, `expected 401, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(updateUserMock.mock.callCount(), 0, 'updateUser must NOT be called with wrong signature');
  });

  it('rejects a body-tampered request even when signature header is present → 401', async () => {
    const originalBody = JSON.stringify(webhookPayload('subscription.charged'));
    const tamperedBody = JSON.stringify({ ...webhookPayload('subscription.charged'), injected: true });
    const sigForOriginal = makeSignature(originalBody);

    // Signature was computed over originalBody, but we send tamperedBody
    const res = await supertestRequest
      .post('/api/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', sigForOriginal)
      .send(tamperedBody);

    assert.equal(res.status, 401, `expected 401, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(updateUserMock.mock.callCount(), 0, 'updateUser must NOT be called after body tampering');
  });

  // ── Valid signature — subscription.charged (grant premium) ──────────────────

  it('grants premium on subscription.charged with valid signature → 200', async () => {
    const body = JSON.stringify(webhookPayload('subscription.charged'));
    const sig = makeSignature(body);

    const res = await supertestRequest
      .post('/api/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', sig)
      .send(body);

    assert.equal(res.status, 200, `expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.deepEqual(res.body, { received: true });
    assert.equal(updateUserMock.mock.callCount(), 1, 'updateUser must be called exactly once');

    const [calledId, calledData] = updateUserMock.mock.calls[0].arguments as [string, Record<string, unknown>];
    assert.equal(calledId, TEST_USER_ID);
    assert.equal(calledData.isPremium, true, 'isPremium must be true for subscription.charged');
    assert.equal(calledData.razorpaySubscriptionId, TEST_SUB_ID);
  });

  // ── Valid signature — subscription.activated (also grants premium) ──────────

  it('grants premium on subscription.activated with valid signature → 200', async () => {
    const body = JSON.stringify(webhookPayload('subscription.activated'));
    const sig = makeSignature(body);

    const res = await supertestRequest
      .post('/api/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', sig)
      .send(body);

    assert.equal(res.status, 200);
    assert.equal(updateUserMock.mock.callCount(), 1);

    const [calledId, calledData] = updateUserMock.mock.calls[0].arguments as [string, Record<string, unknown>];
    assert.equal(calledId, TEST_USER_ID);
    assert.equal(calledData.isPremium, true);
  });

  // ── Valid signature — subscription.halted (revoke premium) ─────────────────

  it('revokes premium on subscription.halted with valid signature → 200', async () => {
    const body = JSON.stringify(webhookPayload('subscription.halted'));
    const sig = makeSignature(body);

    const res = await supertestRequest
      .post('/api/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', sig)
      .send(body);

    assert.equal(res.status, 200, `expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.deepEqual(res.body, { received: true });
    assert.equal(updateUserMock.mock.callCount(), 1, 'updateUser must be called exactly once');

    const [calledId, calledData] = updateUserMock.mock.calls[0].arguments as [string, Record<string, unknown>];
    assert.equal(calledId, TEST_USER_ID);
    assert.equal(calledData.isPremium, false, 'isPremium must be false for subscription.halted');
  });

  // ── Valid signature — subscription.cancelled (also revokes premium) ─────────

  it('revokes premium on subscription.cancelled with valid signature → 200', async () => {
    const body = JSON.stringify(webhookPayload('subscription.cancelled'));
    const sig = makeSignature(body);

    const res = await supertestRequest
      .post('/api/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', sig)
      .send(body);

    assert.equal(res.status, 200);
    assert.equal(updateUserMock.mock.callCount(), 1);

    const [, calledData] = updateUserMock.mock.calls[0].arguments as [string, Record<string, unknown>];
    assert.equal(calledData.isPremium, false);
  });

  // ── Unknown events — pass through without a DB write ───────────────────────

  it('returns 200 without a DB update for unrecognised event types', async () => {
    const body = JSON.stringify(webhookPayload('subscription.pending'));
    const sig = makeSignature(body);

    const res = await supertestRequest
      .post('/api/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', sig)
      .send(body);

    assert.equal(res.status, 200);
    assert.equal(updateUserMock.mock.callCount(), 0, 'unknown events must NOT trigger a DB update');
  });

  it('does not let an older activation replay restore premium after cancellation', async () => {
    const cancelledBody = JSON.stringify(webhookPayload('subscription.cancelled', {
      id: 'evt-cancel',
      createdAt: 2_000,
    }));
    const cancelledRes = await supertestRequest
      .post('/api/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', makeSignature(cancelledBody))
      .send(cancelledBody);

    assert.equal(cancelledRes.status, 200);
    assert.equal(fakeUser.isPremium, false);
    assert.equal(fakeUser.razorpaySubscriptionStatus, 'cancelled');

    const replayBody = JSON.stringify(webhookPayload('subscription.activated', {
      id: 'evt-old-activation',
      createdAt: 1_000,
    }));
    const replayRes = await supertestRequest
      .post('/api/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', makeSignature(replayBody))
      .send(replayBody);

    assert.equal(replayRes.status, 200);
    assert.equal(replayRes.body.ignored, 'stale_event');
    assert.equal(fakeUser.isPremium, false, 'replayed activation must not restore premium');
    assert.equal(
      updateUserMock.mock.callCount(),
      1,
      'only the cancellation should have updated the user',
    );
  });

  it('ignores events from an older subscription after a new purchase', async () => {
    fakeUser = {
      ...fakeUser,
      isPremium: true,
      razorpaySubscriptionId: 'sub_NEW',
      razorpaySubscriptionStatus: 'active',
    };

    const oldEventBody = JSON.stringify(webhookPayload('subscription.cancelled', {
      id: 'evt-old-sub',
      createdAt: 3_000,
      subscriptionId: TEST_SUB_ID,
    }));
    const response = await supertestRequest
      .post('/api/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', makeSignature(oldEventBody))
      .send(oldEventBody);

    assert.equal(response.status, 200);
    assert.equal(response.body.ignored, 'stale_subscription');
    assert.equal(fakeUser.isPremium, true);
    assert.equal(updateUserMock.mock.callCount(), 0);
  });
});
