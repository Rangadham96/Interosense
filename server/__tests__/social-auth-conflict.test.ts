/**
 * Regression coverage for social sign-in colliding with an email/password account.
 * Both native social auth and web Google Identity Services must reject the
 * collision without changing the account's provider details.
 */

import { after, before, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import express, { type Application } from "express";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_placeholder";
process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = "test-google-client";

import { storage } from "../storage";

const passwordUser = {
  id: "password-user",
  email: "person@example.com",
  password: "stored-password-hash",
  name: "Person",
  provider: "email",
  providerId: null,
};

const getUserByEmailMock = mock.fn(async () => ({ ...passwordUser }));
const updateUserMock = mock.fn(async () => ({ ...passwordUser }));
const createUserMock = mock.fn(async () => ({ ...passwordUser }));

(storage as any).getUserByEmail = getUserByEmailMock;
(storage as any).updateUser = updateUserMock;
(storage as any).createUser = createUserMock;

import authRouter, { SOCIAL_PASSWORD_ACCOUNT_MESSAGE } from "../auth";

function buildApp(): Application {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).session = {
      save(callback: (error?: unknown) => void) {
        callback();
      },
    };
    next();
  });
  app.use(authRouter);
  return app;
}

const originalFetch = globalThis.fetch;
let request: any;

before(async () => {
  const supertest = (await import("supertest")).default;
  request = supertest(buildApp());
});

beforeEach(() => {
  getUserByEmailMock.mock.resetCalls();
  updateUserMock.mock.resetCalls();
  createUserMock.mock.resetCalls();
  const expectedAudience =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    "test-google-client";
  globalThis.fetch = mock.fn(async () =>
    new Response(
      JSON.stringify({
        aud: expectedAudience,
        email: "person@example.com",
        email_verified: "true",
        name: "Person",
        sub: "google-user-id",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  ) as typeof fetch;
});

after(() => {
  globalThis.fetch = originalFetch;
});

function assertPasswordConflict(res: any) {
  assert.equal(res.status, 409);
  assert.equal(res.body.code, "PASSWORD_ACCOUNT_EXISTS");
  assert.equal(res.body.message, SOCIAL_PASSWORD_ACCOUNT_MESSAGE);
  assert.match(res.body.message, /email and password/i);
  assert.match(res.body.message, /Profile settings/i);
  assert.equal(updateUserMock.mock.callCount(), 0);
  assert.equal(createUserMock.mock.callCount(), 0);
}

describe("social sign-in password-account conflicts", () => {
  it("rejects native Google sign-in without overwriting the password account", async () => {
    const res = await request.post("/api/auth/social").send({
      provider: "google",
      idToken: "valid-google-token",
    });

    assertPasswordConflict(res);
  });

  it("rejects web Google sign-in without overwriting the password account", async () => {
    const res = await request.post("/api/auth/google/verify").send({
      credential: "valid-google-credential",
    });

    assertPasswordConflict(res);
  });
});