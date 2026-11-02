process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_ENABLED = "false";
process.env.REQUIRE_EMAIL_VERIFICATION = "false";
process.env.DELIVERY_FEE = "5.00";
process.env.CURRENCY = "GHS";
process.env.PAYSTACK_SECRET_KEY = "";

import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { Server } from "node:http";
import { eq, inArray, like } from "drizzle-orm";

const { app } = await import("../app");
const { db, pool } = await import("../config/db");
const { userService } = await import("../service/user.service");
const { isUniqueViolation } = await import("../common/utils/db-errors");
const { categories } = await import("../db/tables/categories");
const { menu, menuVariants } = await import("../db/tables/menu");
const { orders } = await import("../db/tables/orders");
const { payments } = await import("../db/tables/payments");
const { users } = await import("../db/tables/users");

const RUN_ID = `ord-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
const PASSWORD = "StrongPassw0rd!";

interface TestUser {
  id: string;
  email: string;
  accessToken: string;
}

interface ApiResponse {
  status: number;
  // Assertions read arbitrary response shapes.
  body: any;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  accessToken?: string;
}

let server: Server;
let baseUrl = "";
let categoryId = "";
let variantAId = "";
let variantBId = "";
let customerA: TestUser;
let customerB: TestUser;
let admin: TestUser;
let deliveryOrderId = "";

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
  };
}

async function registerUser(suffix: string): Promise<TestUser> {
  const email = emailFor(suffix);
  const response = await api("/api/v1/auth/register", {
    method: "POST",
    body: { name: `Test ${suffix}`, email, password: PASSWORD },
  });

  assert.equal(response.status, 201, JSON.stringify(response.body));

  return {
    id: response.body.data.user.id,
    email,
    accessToken: response.body.data.accessToken,
  };
}

function createOrderBody(
  fulfillmentType: "PICKUP" | "DELIVERY",
  items: { variantId: string; quantity: number }[],
): Record<string, unknown> {
  return {
    items,
    fulfillmentType,
    customerPhone: "024 000 0000",
    ...(fulfillmentType === "DELIVERY"
      ? { deliveryAddress: "12 Test Street, Accra" }
      : {}),
  };
}

async function createOrder(
  user: TestUser,
  fulfillmentType: "PICKUP" | "DELIVERY",
  items: { variantId: string; quantity: number }[],
): Promise<ApiResponse> {
  return api("/api/v1/orders", {
    method: "POST",
    accessToken: user.accessToken,
    body: createOrderBody(fulfillmentType, items),
  });
}

async function cleanup(): Promise<void> {
  const testUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.email, `${RUN_ID}-%`));

  if (testUsers.length > 0) {
    await db.delete(orders).where(
      inArray(
        orders.userId,
        testUsers.map((user) => user.id),
      ),
    );
  }

  await db.delete(users).where(like(users.email, `${RUN_ID}-%`));
  await db.delete(categories).where(like(categories.name, `%${RUN_ID}%`));
}

before(async () => {
  await cleanup();

  const suffix = randomBytes(3).toString("hex");
  const [category] = await db
    .insert(categories)
    .values({ name: `Orders ${RUN_ID}`, slug: `orders-${suffix}-${RUN_ID}` })
    .returning();

  if (!category) {
    throw new Error("Failed to seed a test category.");
  }

  categoryId = category.id;

  const [menuItem] = await db
    .insert(menu)
    .values({
      categoryId,
      name: `Jollof ${RUN_ID}`,
      description: "Test menu item",
    })
    .returning();

  if (!menuItem) {
    throw new Error("Failed to seed a test menu item.");
  }

  const variants = await db
    .insert(menuVariants)
    .values([
      { menuId: menuItem.id, size: "Large", price: "45.50" },
      { menuId: menuItem.id, size: "Small", price: "20.00" },
    ])
    .returning();

  const [large, small] = variants;

  if (!large || !small) {
    throw new Error("Failed to seed test variants.");
  }

  variantAId = large.id;
  variantBId = small.id;

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a port.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;

  customerA = await registerUser("customer-a");
  customerB = await registerUser("customer-b");
  admin = await registerUser("admin");
  await userService.updateRole(admin.id, "ADMIN");
});

after(async () => {
  await cleanup();

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  await pool.end();
});

test("requires authentication to place an order", async () => {
  const response = await api("/api/v1/orders", {
    method: "POST",
    body: createOrderBody("PICKUP", [{ variantId: variantAId, quantity: 1 }]),
  });

  assert.equal(response.status, 401);
});

test("prices orders on the server and applies the delivery fee", async () => {
  const delivery = await createOrder(customerA, "DELIVERY", [
    { variantId: variantAId, quantity: 2 },
  ]);

  assert.equal(delivery.status, 201, JSON.stringify(delivery.body));

  const deliveryOrder = delivery.body.data;
  deliveryOrderId = deliveryOrder.id;

  assert.equal(deliveryOrder.subtotal, "91.00");
  assert.equal(deliveryOrder.deliveryFee, "5.00");
  assert.equal(deliveryOrder.total, "96.00");
  assert.equal(deliveryOrder.currency, "GHS");
  assert.equal(deliveryOrder.status, "PENDING");
  assert.equal(deliveryOrder.paymentStatus, "PENDING");
  assert.equal(deliveryOrder.deliveryAddress, "12 Test Street, Accra");
  assert.equal(deliveryOrder.items.length, 1);
  assert.equal(deliveryOrder.items[0].menuName, `Jollof ${RUN_ID}`);
  assert.equal(deliveryOrder.items[0].variantSize, "Large");
  assert.equal(deliveryOrder.items[0].unitPrice, "45.50");
  assert.equal(deliveryOrder.items[0].quantity, 2);
  assert.equal(deliveryOrder.items[0].lineTotal, "91.00");

  const pickup = await createOrder(customerA, "PICKUP", [
    { variantId: variantBId, quantity: 1 },
  ]);

  assert.equal(pickup.status, 201, JSON.stringify(pickup.body));

  const pickupOrder = pickup.body.data;

  assert.equal(pickupOrder.subtotal, "20.00");
  assert.equal(pickupOrder.deliveryFee, "0.00");
  assert.equal(pickupOrder.total, "20.00");
  assert.equal(pickupOrder.deliveryAddress, null);
});

test("merges duplicate variants into a single line", async () => {
  const response = await createOrder(customerA, "PICKUP", [
    { variantId: variantAId, quantity: 1 },
    { variantId: variantAId, quantity: 2 },
  ]);

  assert.equal(response.status, 201, JSON.stringify(response.body));
  assert.equal(response.body.data.items.length, 1);
  assert.equal(response.body.data.items[0].quantity, 3);
  assert.equal(response.body.data.total, "136.50");
});

test("validates order payloads", async () => {
  const missingAddress = await api("/api/v1/orders", {
    method: "POST",
    accessToken: customerA.accessToken,
    body: {
      items: [{ variantId: variantAId, quantity: 1 }],
      fulfillmentType: "DELIVERY",
      customerPhone: "024 000 0000",
    },
  });

  assert.equal(missingAddress.status, 400);

  const unknownVariant = await createOrder(customerA, "PICKUP", [
    { variantId: "00000000-0000-4000-8000-000000000000", quantity: 1 },
  ]);

  assert.equal(unknownVariant.status, 400);

  const invalidQuantity = await createOrder(customerA, "PICKUP", [
    { variantId: variantAId, quantity: 0 },
  ]);

  assert.equal(invalidQuantity.status, 400);

  const invalidPhone = await api("/api/v1/orders", {
    method: "POST",
    accessToken: customerA.accessToken,
    body: {
      items: [{ variantId: variantAId, quantity: 1 }],
      fulfillmentType: "PICKUP",
      customerPhone: "call me",
    },
  });

  assert.equal(invalidPhone.status, 400);
});

test("keeps each customer's orders private", async () => {
  const otherCustomer = await api(`/api/v1/orders/${deliveryOrderId}`, {
    accessToken: customerB.accessToken,
  });

  assert.equal(otherCustomer.status, 404);

  const otherList = await api("/api/v1/orders", {
    accessToken: customerB.accessToken,
  });

  assert.equal(otherList.status, 200);
  assert.equal(otherList.body.data.length, 0);

  const ownList = await api("/api/v1/orders", {
    accessToken: customerA.accessToken,
  });

  assert.equal(ownList.status, 200);
  assert.ok(
    ownList.body.data.some(
      (order: { id: string }) => order.id === deliveryOrderId,
    ),
  );

  const detail = await api(`/api/v1/orders/${deliveryOrderId}`, {
    accessToken: customerA.accessToken,
  });

  assert.equal(detail.status, 200);
  assert.deepEqual(detail.body.data.payments, []);
});

test("lets administrators list orders and enforces valid status transitions", async () => {
  const adminList = await api("/api/v1/orders?limit=100", {
    accessToken: admin.accessToken,
  });

  assert.equal(adminList.status, 200);
  assert.ok(
    adminList.body.data.some(
      (order: { id: string }) => order.id === deliveryOrderId,
    ),
  );

  const customerTransition = await api(
    `/api/v1/orders/${deliveryOrderId}/status`,
    {
      method: "PATCH",
      accessToken: customerA.accessToken,
      body: { status: "CONFIRMED" },
    },
  );

  assert.equal(customerTransition.status, 403);

  const skipped = await api(`/api/v1/orders/${deliveryOrderId}/status`, {
    method: "PATCH",
    accessToken: admin.accessToken,
    body: { status: "PREPARING" },
  });

  assert.equal(skipped.status, 400);

  for (const status of [
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
  ]) {
    const transition = await api(`/api/v1/orders/${deliveryOrderId}/status`, {
      method: "PATCH",
      accessToken: admin.accessToken,
      body: { status },
    });

    assert.equal(transition.status, 200, JSON.stringify(transition.body));
    assert.equal(transition.body.data.status, status);
  }

  const terminal = await api(`/api/v1/orders/${deliveryOrderId}/status`, {
    method: "PATCH",
    accessToken: admin.accessToken,
    body: { status: "CANCELLED" },
  });

  assert.equal(terminal.status, 400);

  const pickupToDeliveryStep = await createOrder(customerA, "PICKUP", [
    { variantId: variantBId, quantity: 1 },
  ]);

  const pickupId = pickupToDeliveryStep.body.data.id;

  for (const status of ["CONFIRMED", "PREPARING", "READY"]) {
    const transition = await api(`/api/v1/orders/${pickupId}/status`, {
      method: "PATCH",
      accessToken: admin.accessToken,
      body: { status },
    });

    assert.equal(transition.status, 200, JSON.stringify(transition.body));
  }

  const outForDelivery = await api(`/api/v1/orders/${pickupId}/status`, {
    method: "PATCH",
    accessToken: admin.accessToken,
    body: { status: "OUT_FOR_DELIVERY" },
  });

  assert.equal(outForDelivery.status, 400);
});

test("cancels unpaid orders and abandons pending payment attempts", async () => {
  const created = await createOrder(customerA, "PICKUP", [
    { variantId: variantBId, quantity: 2 },
  ]);

  assert.equal(created.status, 201, JSON.stringify(created.body));

  const order = created.body.data;

  const [payment] = await db
    .insert(payments)
    .values({
      orderId: order.id,
      provider: "PAYSTACK",
      status: "PENDING",
      reference: `${order.orderNumber}-TESTPENDING`,
      amount: order.total,
      currency: order.currency,
    })
    .returning();

  if (!payment) {
    throw new Error("Failed to seed a pending payment.");
  }

  const cancelled = await api(`/api/v1/orders/${order.id}/cancel`, {
    method: "POST",
    accessToken: customerA.accessToken,
    body: { reason: "Changed my mind" },
  });

  assert.equal(cancelled.status, 200, JSON.stringify(cancelled.body));
  assert.equal(cancelled.body.data.status, "CANCELLED");

  const [storedPayment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, payment.id));

  assert.equal(storedPayment?.status, "ABANDONED");

  const twice = await api(`/api/v1/orders/${order.id}/cancel`, {
    method: "POST",
    accessToken: customerA.accessToken,
    body: {},
  });

  assert.equal(twice.status, 409);

  const preparing = await createOrder(customerA, "PICKUP", [
    { variantId: variantBId, quantity: 1 },
  ]);

  const preparingId = preparing.body.data.id;

  for (const status of ["CONFIRMED", "PREPARING"]) {
    const transition = await api(`/api/v1/orders/${preparingId}/status`, {
      method: "PATCH",
      accessToken: admin.accessToken,
      body: { status },
    });

    assert.equal(transition.status, 200, JSON.stringify(transition.body));
  }

  const tooLate = await api(`/api/v1/orders/${preparingId}/cancel`, {
    method: "POST",
    accessToken: customerA.accessToken,
    body: {},
  });

  assert.equal(tooLate.status, 409);

  const otherCustomerCancel = await api(
    `/api/v1/orders/${preparingId}/cancel`,
    {
      method: "POST",
      accessToken: customerB.accessToken,
      body: {},
    },
  );

  assert.equal(otherCustomerCancel.status, 404);
});

test("allows only one pending payment attempt per order", async () => {
  const created = await createOrder(customerA, "PICKUP", [
    { variantId: variantBId, quantity: 1 },
  ]);

  assert.equal(created.status, 201, JSON.stringify(created.body));

  const order = created.body.data;

  await db.insert(payments).values({
    orderId: order.id,
    provider: "PAYSTACK",
    status: "PENDING",
    reference: `${order.orderNumber}-FIRST`,
    amount: order.total,
    currency: order.currency,
  });

  let uniqueViolation = false;

  try {
    await db.insert(payments).values({
      orderId: order.id,
      provider: "PAYSTACK",
      status: "PENDING",
      reference: `${order.orderNumber}-SECOND`,
      amount: order.total,
      currency: order.currency,
    });
  } catch (error) {
    uniqueViolation = isUniqueViolation(error);
  }

  assert.equal(uniqueViolation, true);
});

test("fails payment initialization when Paystack is not configured", async () => {
  const created = await createOrder(customerA, "PICKUP", [
    { variantId: variantBId, quantity: 1 },
  ]);

  assert.equal(created.status, 201, JSON.stringify(created.body));

  const initialized = await api(
    `/api/v1/orders/${created.body.data.id}/payments/initialize`,
    {
      method: "POST",
      accessToken: customerA.accessToken,
    },
  );

  assert.equal(initialized.status, 503);

  const unknownReference = await api("/api/v1/payments/verify", {
    method: "POST",
    accessToken: customerA.accessToken,
    body: { reference: `${created.body.data.orderNumber}-MISSING` },
  });

  assert.equal(unknownReference.status, 404);
});
