import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { env } from "../../config/env";
import {
  BadGatewayError,
  ServiceUnavailableError,
} from "../../errors/app-error";

const initializeResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    authorization_url: z.url(),
    access_code: z.string(),
    reference: z.string(),
  }),
});

const transactionSchema = z.object({
  id: z.number(),
  status: z.string(),
  reference: z.string(),
  amount: z.number(),
  currency: z.string(),
  channel: z.string().nullish(),
  paid_at: z.string().nullish(),
  gateway_response: z.string().nullish(),
});

const verifyResponseSchema = z.object({
  status: z.boolean(),
  message: z.string().optional(),
  data: transactionSchema,
});

const webhookEventSchema = z.object({
  event: z.string(),
  data: z.unknown(),
});

export interface InitializeTransactionInput {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}

export interface InitializedTransaction {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface VerifiedTransaction {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string | null;
  paidAt: string | null;
  gatewayResponse: string | null;
}

export interface ParsedWebhookEvent {
  event: string;
  transaction: VerifiedTransaction | null;
}

function toVerifiedTransaction(
  data: z.infer<typeof transactionSchema>,
): VerifiedTransaction {
  return {
    id: data.id,
    status: data.status,
    reference: data.reference,
    amount: data.amount,
    currency: data.currency,
    channel: data.channel ?? null,
    paidAt: data.paid_at ?? null,
    gatewayResponse: data.gateway_response ?? null,
  };
}

function providerMessage(payload: unknown): string | undefined {
  return typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
    ? payload.message
    : undefined;
}

export class PaystackService {
  isConfigured(): boolean {
    return Boolean(env.PAYSTACK_SECRET_KEY);
  }

  private getSecretKey(): string {
    if (!env.PAYSTACK_SECRET_KEY) {
      throw new ServiceUnavailableError(
        "Online payments are not configured. Please contact support.",
      );
    }

    return env.PAYSTACK_SECRET_KEY;
  }

  private async request<T>(
    path: string,
    schema: z.ZodType<T>,
    init: { method: string; body?: string },
  ): Promise<T> {
    const url = `${env.PAYSTACK_BASE_URL.replace(/\/+$/, "")}${path}`;
    let response: Response;

    try {
      response = await fetch(url, {
        method: init.method,
        headers: {
          authorization: `Bearer ${this.getSecretKey()}`,
          "content-type": "application/json",
        },
        ...(init.body === undefined ? {} : { body: init.body }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      console.error(
        "[paystack] Network error:",
        error instanceof Error ? error.message : error,
      );
      throw new BadGatewayError(
        "Could not reach the payment provider. Please try again.",
      );
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      console.error(
        `[paystack] ${init.method} ${path} failed with ${response.status}:`,
        providerMessage(payload) ?? "no message",
      );
      throw new BadGatewayError(
        "The payment provider rejected the request. Please try again.",
      );
    }

    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      console.error(
        `[paystack] Unexpected response for ${path}:`,
        parsed.error.flatten(),
      );
      throw new BadGatewayError(
        "The payment provider returned an unexpected response.",
      );
    }

    return parsed.data;
  }

  async initializeTransaction(
    input: InitializeTransactionInput,
  ): Promise<InitializedTransaction> {
    const response = await this.request(
      "/transaction/initialize",
      initializeResponseSchema,
      {
        method: "POST",
        body: JSON.stringify({
          email: input.email,
          amount: input.amount,
          currency: input.currency,
          reference: input.reference,
          callback_url: input.callbackUrl,
          metadata: input.metadata,
        }),
      },
    );

    return {
      authorizationUrl: response.data.authorization_url,
      accessCode: response.data.access_code,
      reference: response.data.reference,
    };
  }

  async verifyTransaction(reference: string): Promise<VerifiedTransaction> {
    const response = await this.request(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      verifyResponseSchema,
      { method: "GET" },
    );

    if (!response.status) {
      throw new BadGatewayError(
        "The payment provider could not verify this transaction.",
      );
    }

    return toVerifiedTransaction(response.data);
  }

  verifyWebhookSignature(
    rawBody: Buffer,
    signature: string | undefined,
  ): boolean {
    const secret = env.PAYSTACK_SECRET_KEY;

    if (!secret || !signature) {
      return false;
    }

    const expected = createHmac("sha512", secret).update(rawBody).digest();
    const provided = Buffer.from(signature, "hex");

    return (
      provided.length === expected.length &&
      timingSafeEqual(expected, provided)
    );
  }

  parseWebhookEvent(rawBody: Buffer): ParsedWebhookEvent | null {
    let payload: unknown;

    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return null;
    }

    const parsed = webhookEventSchema.safeParse(payload);

    if (!parsed.success) {
      return null;
    }

    if (parsed.data.event !== "charge.success") {
      return { event: parsed.data.event, transaction: null };
    }

    const transaction = transactionSchema.safeParse(parsed.data.data);

    if (!transaction.success) {
      console.error(
        "[paystack] charge.success webhook had an unexpected payload:",
        transaction.error.flatten(),
      );
      return { event: parsed.data.event, transaction: null };
    }

    return {
      event: parsed.data.event,
      transaction: toVerifiedTransaction(transaction.data),
    };
  }
}

export const paystackService = new PaystackService();
