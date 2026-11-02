process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_ENABLED = "false";
process.env.PAYSTACK_SECRET_KEY = "test_secret_key_1234567890";

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import type { Server } from "node:http";

const { app } = await import("../app");
const { pool } = await import("../config/db");

const SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";
const WEBHOOK_PATH = "/api/v1/payments/webhook/paystack";

let server: Server;
let baseUrl = "";

function sign(body: string): string {
  return createHmac("sha512", SECRET).update(body).digest("hex");
}

async function postWebhook(
  body: string,
  signature?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (signature) {
    headers["x-paystack-signature"] = signature;
  }

  return fetch(`${baseUrl}${WEBHOOK_PATH}`, {
    method: "POST",
    headers,
    body,
  });
}

function chargeSuccessPayload(reference: string): string {
  return JSON.stringify({
    event: "charge.success",
    data: {
      id: 123456789,
      status: "success",
      reference,
      amount: 9600,
      currency: "GHS",
      channel: "card",
      paid_at: "2026-11-02T12:00:00.000Z",
      gateway_response: "Successful",
    },
  });
}

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

  await pool.end();
});

test("rejects webhooks without a signature", async () => {
  const response = await postWebhook(chargeSuccessPayload("MP-TEST-NOSIG"));

  assert.equal(response.status, 401);
});

test("rejects webhooks with an invalid signature", async () => {
  const body = chargeSuccessPayload("MP-TEST-BADSIG");

  const wrongSecret = createHmac("sha512", "another_secret")
    .update(body)
    .digest("hex");
  const wrongLength = createHmac("sha512", SECRET)
    .update(body)
    .digest("hex")
    .slice(0, 20);

  const wrongSecretResponse = await postWebhook(body, wrongSecret);
  const wrongLengthResponse = await postWebhook(body, wrongLength);

  assert.equal(wrongSecretResponse.status, 401);
  assert.equal(wrongLengthResponse.status, 401);
});

test("acknowledges non-charge events without processing them", async () => {
  const body = JSON.stringify({ event: "transfer.success", data: {} });
  const response = await postWebhook(body, sign(body));

  assert.equal(response.status, 200);

  const payload = (await response.json()) as { success: boolean };
  assert.equal(payload.success, true);
});

test("acknowledges charge.success events for unknown references", async () => {
  const body = chargeSuccessPayload(`MP-UNKNOWN-${Date.now()}`);
  const response = await postWebhook(body, sign(body));

  assert.equal(response.status, 200);

  const repeated = await postWebhook(body, sign(body));
  assert.equal(repeated.status, 200);
});

test("rejects signed payloads that are not valid JSON", async () => {
  const body = '{"event":"charge.success",';

  const response = await postWebhook(body, sign(body));

  assert.equal(response.status, 400);
});
