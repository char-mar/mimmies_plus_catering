import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import express from "express";

import { createRateLimiter } from "../middleware/rate-limit.middleware";
import { errorHandler } from "../middleware/error.middleware";

const app = express();

app.get(
  "/limited",
  createRateLimiter({
    windowMs: 60_000,
    limit: 2,
    message: "Slow down.",
    enabled: true,
  }),
  (_req, res) => {
    res.json({ ok: true });
  },
);

app.get(
  "/unlimited",
  createRateLimiter({
    windowMs: 60_000,
    limit: 1,
    message: "Slow down.",
    enabled: false,
  }),
  (_req, res) => {
    res.json({ ok: true });
  },
);

app.use(errorHandler);

let server: Server;
let baseUrl = "";

before(async () => {
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
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("returns 429 once the window limit is exceeded", async () => {
  const first = await fetch(`${baseUrl}/limited`);
  const second = await fetch(`${baseUrl}/limited`);
  const third = await fetch(`${baseUrl}/limited`);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(third.status, 429);

  const body = (await third.json()) as { success: boolean; message: string };

  assert.equal(body.success, false);
  assert.equal(body.message, "Slow down.");
  assert.ok(third.headers.get("ratelimit"));
});

test("does not limit requests when disabled", async () => {
  for (let index = 0; index < 4; index += 1) {
    const response = await fetch(`${baseUrl}/unlimited`);
    assert.equal(response.status, 200);
  }
});
