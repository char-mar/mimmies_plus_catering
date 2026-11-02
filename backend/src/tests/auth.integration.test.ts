process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_ENABLED = "false";
process.env.REQUIRE_EMAIL_VERIFICATION = "false";

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { Server } from "node:http";
import { like } from "drizzle-orm";

import { users } from "../db/tables/users";
import type { OutboundEmail } from "../common/services/mail.service";

const { app } = await import("../app");
const { db, pool } = await import("../config/db");
const { userService } = await import("../service/user.service");
const { mailService } = await import("../common/services/mail.service");

const RUN_ID = `it-${Date.now()}-${randomBytes(4).toString("hex")}`;
const PASSWORD = "StrongPassw0rd!";
const NEW_PASSWORD = "EvenStrongerPassw0rd!";
const RESET_PASSWORD = "ResetStrongPassw0rd!";

interface TestUser {
  id: string;
  email: string;
  password: string;
  accessToken: string;
  cookie: string;
}

interface ApiResponse {
  status: number;
  // Assertions read arbitrary response shapes.
  body: any;
  cookies: string[];
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  accessToken?: string;
  cookie?: string;
}

let server: Server;
let baseUrl = "";
let customerA: TestUser;

function emailFor(suffix: string): string {
  return `${RUN_ID}-${suffix}@example.test`;
}

async function api(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse> {
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
  }

  if (options.accessToken) {
    headers.authorization = `Bearer ${options.accessToken}`;
  }

  if (options.cookie) {
    headers.cookie = options.cookie;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
  });

  const text = await response.text();

  return {
    status: response.status,
    body: text.length > 0 ? JSON.parse(text) : null,
    cookies: response.headers.getSetCookie(),
  };
}

function refreshCookie(response: ApiResponse): string {
  const header = response.cookies.find((cookie) =>
    cookie.startsWith("refresh_token="),
  );

  assert.ok(header, "Expected a refresh_token cookie");

  return header.split(";")[0] ?? "";
}

async function registerUser(
  suffix: string,
  password = PASSWORD,
): Promise<TestUser> {
  const email = emailFor(suffix);
  const response = await api("/api/v1/auth/register", {
    method: "POST",
    body: { name: `Test ${suffix}`, email, password },
  });

  assert.equal(response.status, 201, JSON.stringify(response.body));

  return {
    id: response.body.data.user.id,
    email,
    password,
    accessToken: response.body.data.accessToken,
    cookie: refreshCookie(response),
  };
}

function login(email: string, password: string): Promise<ApiResponse> {
  return api("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

function lastEmailTo(email: string): OutboundEmail {
  const messages = mailService.getOutbox();

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message?.to === email) {
      return message;
    }
  }

  throw new Error(`No email was sent to ${email}`);
}

function tokenFromEmail(message: OutboundEmail, pathname: string): string {
  const match = new RegExp(`${pathname}\\?token=([A-Za-z0-9_-]+)`).exec(
    message.text,
  );
  const token = match?.[1];

  if (!token) {
    throw new Error(`No token found in email "${message.subject}"`);
  }

  return token;
}

async function cleanupUsers(): Promise<void> {
  await db.delete(users).where(like(users.email, `${RUN_ID}-%`));
}

before(async () => {
  await cleanupUsers();

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a port.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await cleanupUsers();

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  await pool.end();
});

test("registers a customer and enforces authentication", async () => {
  const response = await api("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Customer A",
      email: emailFor("customer-a"),
      password: PASSWORD,
    },
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.user.role, "CUSTOMER");
  assert.equal(response.body.data.user.isEmailVerified, false);

  customerA = {
    id: response.body.data.user.id,
    email: emailFor("customer-a"),
    password: PASSWORD,
    accessToken: response.body.data.accessToken,
    cookie: refreshCookie(response),
  };

  const me = await api("/api/v1/auth/me", {
    accessToken: customerA.accessToken,
  });

  assert.equal(me.status, 200);
  assert.equal(me.body.data.id, customerA.id);

  const anonymousWrite = await api("/api/v1/categories", {
    method: "POST",
    body: { name: "Not allowed" },
  });

  assert.equal(anonymousWrite.status, 401);

  const customerWrite = await api("/api/v1/categories", {
    method: "POST",
    body: { name: "Not allowed" },
    accessToken: customerA.accessToken,
  });

  assert.equal(customerWrite.status, 403);

  const adminList = await api("/api/v1/users", {
    accessToken: customerA.accessToken,
  });

  assert.equal(adminList.status, 403);
});

test("verifies an email address with the emailed token", async () => {
  mailService.clearOutbox();

  const request = await api("/api/v1/auth/verify-email/request", {
    method: "POST",
    accessToken: customerA.accessToken,
  });

  assert.equal(request.status, 200);

  const token = tokenFromEmail(lastEmailTo(customerA.email), "/verify-email");

  const confirm = await api("/api/v1/auth/verify-email/confirm", {
    method: "POST",
    body: { token },
  });

  assert.equal(confirm.status, 200);

  const reused = await api("/api/v1/auth/verify-email/confirm", {
    method: "POST",
    body: { token },
  });

  assert.equal(reused.status, 400);

  const me = await api("/api/v1/auth/me", {
    accessToken: customerA.accessToken,
  });

  assert.equal(me.body.data.isEmailVerified, true);
});

test("rejects unknown accounts and wrong passwords identically", async () => {
  const unknown = await login(emailFor("missing"), PASSWORD);
  const wrongPassword = await login(customerA.email, "WrongPassword123!");

  assert.equal(unknown.status, 401);
  assert.equal(wrongPassword.status, 401);
  assert.equal(unknown.body.message, wrongPassword.body.message);
});

test("rotates refresh tokens and revokes the family on reuse", async () => {
  const signedIn = await login(customerA.email, customerA.password);
  assert.equal(signedIn.status, 200);

  const firstCookie = refreshCookie(signedIn);

  const firstRefresh = await api("/api/v1/auth/refresh", {
    method: "POST",
    cookie: firstCookie,
  });

  assert.equal(firstRefresh.status, 200);
  const secondCookie = refreshCookie(firstRefresh);

  const reuse = await api("/api/v1/auth/refresh", {
    method: "POST",
    cookie: firstCookie,
  });

  assert.equal(reuse.status, 401);

  const afterReuse = await api("/api/v1/auth/refresh", {
    method: "POST",
    cookie: secondCookie,
  });

  assert.equal(afterReuse.status, 401);
});

test("changes a password and invalidates existing sessions", async () => {
  const signedIn = await login(customerA.email, customerA.password);
  const staleAccessToken = signedIn.body.data.accessToken;
  const staleCookie = refreshCookie(signedIn);

  const change = await api("/api/v1/auth/change-password", {
    method: "PATCH",
    accessToken: staleAccessToken,
    body: {
      newPassword: NEW_PASSWORD,
    },
  });

  assert.equal(change.status, 200);

  const staleMe = await api("/api/v1/auth/me", {
    accessToken: staleAccessToken,
  });

  assert.equal(staleMe.status, 401);

  const staleRefresh = await api("/api/v1/auth/refresh", {
    method: "POST",
    cookie: staleCookie,
  });

  assert.equal(staleRefresh.status, 401);

  const oldPassword = await login(customerA.email, customerA.password);
  assert.equal(oldPassword.status, 401);

  const newPassword = await login(customerA.email, NEW_PASSWORD);
  assert.equal(newPassword.status, 200);

  customerA.password = NEW_PASSWORD;
  customerA.accessToken = newPassword.body.data.accessToken;
  customerA.cookie = refreshCookie(newPassword);
});

test("resets a forgotten password and revokes sessions", async () => {
  const signedIn = await login(customerA.email, customerA.password);
  const staleCookie = refreshCookie(signedIn);

  mailService.clearOutbox();

  const request = await api("/api/v1/auth/forgot-password", {
    method: "POST",
    body: { email: customerA.email },
  });

  assert.equal(request.status, 200);

  const unknownRequest = await api("/api/v1/auth/forgot-password", {
    method: "POST",
    body: { email: emailFor("nobody") },
  });

  assert.equal(unknownRequest.status, 200);
  assert.equal(request.body.message, unknownRequest.body.message);

  const token = tokenFromEmail(lastEmailTo(customerA.email), "/reset-password");

  const reset = await api("/api/v1/auth/reset-password", {
    method: "POST",
    body: { token, password: RESET_PASSWORD },
  });

  assert.equal(reset.status, 200);

  const reused = await api("/api/v1/auth/reset-password", {
    method: "POST",
    body: { token, password: "AnotherStrongPassw0rd!" },
  });

  assert.equal(reused.status, 400);

  const staleRefresh = await api("/api/v1/auth/refresh", {
    method: "POST",
    cookie: staleCookie,
  });

  assert.equal(staleRefresh.status, 401);

  const oldPassword = await login(customerA.email, customerA.password);
  assert.equal(oldPassword.status, 401);

  const newPassword = await login(customerA.email, RESET_PASSWORD);
  assert.equal(newPassword.status, 200);

  customerA.password = RESET_PASSWORD;
  customerA.accessToken = newPassword.body.data.accessToken;
  customerA.cookie = refreshCookie(newPassword);
});

test("enforces role hierarchy and account management rules", async () => {
  const customerB = await registerUser("customer-b");
  await userService.updateRole(customerB.id, "ADMIN");

  const list = await api("/api/v1/users", {
    accessToken: customerB.accessToken,
  });

  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.body.data));

  const adminRoleChange = await api(
    `/api/v1/users/${customerB.id}/role`,
    {
      method: "PATCH",
      accessToken: customerB.accessToken,
      body: { role: "SUPER_ADMIN" },
    },
  );

  assert.equal(adminRoleChange.status, 403);

  const selfStatus = await api(
    `/api/v1/users/${customerB.id}/status`,
    {
      method: "PATCH",
      accessToken: customerB.accessToken,
      body: { isActive: false },
    },
  );

  assert.equal(selfStatus.status, 400);

  const deactivate = await api(
    `/api/v1/users/${customerA.id}/status`,
    {
      method: "PATCH",
      accessToken: customerB.accessToken,
      body: { isActive: false },
    },
  );

  assert.equal(deactivate.status, 200);

  const blockedLogin = await login(customerA.email, customerA.password);
  assert.equal(blockedLogin.status, 403);

  const revokedRefresh = await api("/api/v1/auth/refresh", {
    method: "POST",
    cookie: customerA.cookie,
  });

  assert.equal(revokedRefresh.status, 401);

  const reactivate = await api(
    `/api/v1/users/${customerA.id}/status`,
    {
      method: "PATCH",
      accessToken: customerB.accessToken,
      body: { isActive: true },
    },
  );

  assert.equal(reactivate.status, 200);

  const relogin = await login(customerA.email, customerA.password);
  assert.equal(relogin.status, 200);

  customerA.accessToken = relogin.body.data.accessToken;
  customerA.cookie = refreshCookie(relogin);

  const superAdmin = await registerUser("super-admin");
  await userService.updateRole(superAdmin.id, "SUPER_ADMIN");

  const adminOnSuperAdmin = await api(
    `/api/v1/users/${superAdmin.id}/status`,
    {
      method: "PATCH",
      accessToken: customerB.accessToken,
      body: { isActive: false },
    },
  );

  assert.equal(adminOnSuperAdmin.status, 403);

  await userService.updateRole(customerB.id, "SUPER_ADMIN");

  const promoteCustomer = await api(
    `/api/v1/users/${customerA.id}/role`,
    {
      method: "PATCH",
      accessToken: customerB.accessToken,
      body: { role: "ADMIN" },
    },
  );

  assert.equal(promoteCustomer.status, 200);
  assert.equal(promoteCustomer.body.data.role, "ADMIN");

  // The role is reloaded from the database on every request, so the existing
  // access token picks up the promotion immediately.
  const nowAdmin = await api("/api/v1/users", {
    accessToken: customerA.accessToken,
  });

  assert.equal(nowAdmin.status, 200);

  const selfRoleChange = await api(
    `/api/v1/users/${customerB.id}/role`,
    {
      method: "PATCH",
      accessToken: customerB.accessToken,
      body: { role: "CUSTOMER" },
    },
  );

  assert.equal(selfRoleChange.status, 400);
});
