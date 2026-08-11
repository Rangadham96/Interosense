/**
 * Tests for the authenticated account-management routes:
 *   POST /api/auth/change-email
 *   POST /api/auth/change-password
 *
 * Covers: wrong password, duplicate email, invalid email, success,
 * social-login accounts without a password, and weak new passwords.
 *
 * Strategy: patch the shared storage singleton before importing the router.
 * No real DB queries are made.
 *
 * Run: npm run test:server
 */

import { describe, it, before, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import express, { type Application } from 'express';
import bcrypt from 'bcryptjs';

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_placeholder';

const TEST_USER_ID = 'user-account-1';
const CURRENT_PASSWORD = 'origpass1';

import { storage } from '../storage';

let fakeUser: Record<string, unknown> | undefined;
let userByEmail: Record<string, Record<string, unknown>> = {};

const getUserMock = mock.fn(async (_id: string) => fakeUser as any);
const getUserByEmailMock = mock.fn(async (email: string) => userByEmail[email] as any);
const updateUserMock = mock.fn(async (_id: string, data: Record<string, unknown>) => {
  fakeUser = { ...(fakeUser ?? {}), ...data };
  return fakeUser as any;
});
(storage as any).getUser = getUserMock;
(storage as any).getUserByEmail = getUserByEmailMock;
(storage as any).updateUser = updateUserMock;

import authRouter from '../auth';

function buildApp(authenticated = true): Application {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.session = authenticated ? { userId: TEST_USER_ID } : {};
    next();
  });
  app.use(authRouter);
  return app;
}

let hashedCurrent: string;

describe('POST /api/auth/change-email', () => {
  let request: any;

  before(async () => {
    hashedCurrent = await bcrypt.hash(CURRENT_PASSWORD, 4);
    const supertest = (await import('supertest')).default;
    request = supertest(buildApp());
  });

  beforeEach(() => {
    updateUserMock.mock.resetCalls();
    fakeUser = {
      id: TEST_USER_ID,
      email: 'me@example.com',
      password: hashedCurrent,
      provider: 'email',
    };
    userByEmail = {};
  });

  it('rejects when not authenticated → 401', async () => {
    const supertest = (await import('supertest')).default;
    const anonRequest = supertest(buildApp(false));
    const res = await anonRequest.post('/api/auth/change-email').send({
      newEmail: 'new@example.com',
      currentPassword: CURRENT_PASSWORD,
    });
    assert.equal(res.status, 401);
  });

  it('rejects an invalid email address → 400', async () => {
    const res = await request.post('/api/auth/change-email').send({
      newEmail: 'not-an-email',
      currentPassword: CURRENT_PASSWORD,
    });
    assert.equal(res.status, 400);
    assert.equal(updateUserMock.mock.callCount(), 0);
  });

  it('rejects a wrong password → 401', async () => {
    const res = await request.post('/api/auth/change-email').send({
      newEmail: 'new@example.com',
      currentPassword: 'wrong-password',
    });
    assert.equal(res.status, 401);
    assert.equal(updateUserMock.mock.callCount(), 0);
  });

  it('rejects an email already in use → 409', async () => {
    userByEmail['taken@example.com'] = { id: 'someone-else', email: 'taken@example.com' };
    const res = await request.post('/api/auth/change-email').send({
      newEmail: 'taken@example.com',
      currentPassword: CURRENT_PASSWORD,
    });
    assert.equal(res.status, 409);
    assert.equal(updateUserMock.mock.callCount(), 0);
  });

  it('rejects for social accounts without a password → 400 with provider message', async () => {
    fakeUser = { id: TEST_USER_ID, email: 'me@example.com', password: null, provider: 'google' };
    const res = await request.post('/api/auth/change-email').send({
      newEmail: 'new@example.com',
      currentPassword: 'anything',
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Google/);
    assert.equal(updateUserMock.mock.callCount(), 0);
  });

  it('updates the email (normalized to lowercase) on success → 200', async () => {
    const res = await request.post('/api/auth/change-email').send({
      newEmail: 'New@Example.com',
      currentPassword: CURRENT_PASSWORD,
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.user.email, 'new@example.com');
    assert.equal(res.body.user.password, undefined, 'password must never be returned');
    assert.equal(fakeUser?.email, 'new@example.com');
  });
});

describe('POST /api/auth/change-password', () => {
  let request: any;

  before(async () => {
    hashedCurrent = await bcrypt.hash(CURRENT_PASSWORD, 4);
    const supertest = (await import('supertest')).default;
    request = supertest(buildApp());
  });

  beforeEach(() => {
    updateUserMock.mock.resetCalls();
    fakeUser = {
      id: TEST_USER_ID,
      email: 'me@example.com',
      password: hashedCurrent,
      provider: 'email',
    };
  });

  it('rejects a wrong current password → 401', async () => {
    const res = await request.post('/api/auth/change-password').send({
      currentPassword: 'wrong-password',
      newPassword: 'newpass99',
    });
    assert.equal(res.status, 401);
    assert.equal(updateUserMock.mock.callCount(), 0);
  });

  it('rejects a weak new password (same rule as registration) → 400', async () => {
    const res = await request.post('/api/auth/change-password').send({
      currentPassword: CURRENT_PASSWORD,
      newPassword: 'abc',
    });
    assert.equal(res.status, 400);
    assert.equal(updateUserMock.mock.callCount(), 0);
  });

  it('rejects reusing the current password → 400', async () => {
    const res = await request.post('/api/auth/change-password').send({
      currentPassword: CURRENT_PASSWORD,
      newPassword: CURRENT_PASSWORD,
    });
    assert.equal(res.status, 400);
    assert.equal(updateUserMock.mock.callCount(), 0);
  });

  it('rejects for social accounts without a password → 400 with provider message', async () => {
    fakeUser = { id: TEST_USER_ID, email: 'me@example.com', password: null, provider: 'apple' };
    const res = await request.post('/api/auth/change-password').send({
      currentPassword: 'anything',
      newPassword: 'newpass99',
    });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Apple/);
    assert.equal(updateUserMock.mock.callCount(), 0);
  });

  it('hashes and stores the new password on success → 200', async () => {
    const res = await request.post('/api/auth/change-password').send({
      currentPassword: CURRENT_PASSWORD,
      newPassword: 'newpass99',
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(updateUserMock.mock.callCount(), 1);

    const stored = fakeUser?.password as string;
    assert.notEqual(stored, 'newpass99', 'password must be hashed, not plaintext');
    assert.ok(await bcrypt.compare('newpass99', stored), 'stored hash must match the new password');
  });
});
