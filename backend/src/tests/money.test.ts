import { test } from "node:test";
import assert from "node:assert/strict";

import {
  fromMinorUnits,
  toMinorUnits,
} from "../common/utils/money";
import {
  canTransitionOrder,
  nextOrderStatuses,
} from "../common/constants/orders";

test("converts decimal amounts to minor units without floating point error", () => {
  assert.equal(toMinorUnits("45.50"), 4550);
  assert.equal(toMinorUnits("0.01"), 1);
  assert.equal(toMinorUnits("0"), 0);
  assert.equal(toMinorUnits("100"), 10000);
  assert.equal(toMinorUnits("1234.5"), 123450);
  assert.equal(toMinorUnits("9999999999.99"), 999999999999);
});

test("rejects malformed money amounts", () => {
  for (const amount of ["", "abc", "-1", "1.234", "1,50", ".50", "1."]) {
    assert.throws(() => toMinorUnits(amount), /Invalid money amount/);
  }
});

test("formats minor units back into two decimal places", () => {
  assert.equal(fromMinorUnits(4550), "45.50");
  assert.equal(fromMinorUnits(0), "0.00");
  assert.equal(fromMinorUnits(1), "0.01");
  assert.equal(fromMinorUnits(999999999999), "9999999999.99");
});

test("rejects invalid minor unit values", () => {
  assert.throws(() => fromMinorUnits(-1), /Invalid minor unit amount/);
  assert.throws(() => fromMinorUnits(10.5), /Invalid minor unit amount/);
});

test("round-trips money values through minor units", () => {
  for (const amount of ["0.00", "0.99", "5.00", "45.50", "1234.56"]) {
    assert.equal(fromMinorUnits(toMinorUnits(amount)), amount);
  }
});

test("allows only forward order transitions", () => {
  assert.equal(canTransitionOrder("PENDING", "CONFIRMED", "PICKUP"), true);
  assert.equal(canTransitionOrder("PENDING", "CANCELLED", "PICKUP"), true);
  assert.equal(canTransitionOrder("PENDING", "PREPARING", "PICKUP"), false);
  assert.equal(canTransitionOrder("READY", "COMPLETED", "PICKUP"), true);
  assert.equal(canTransitionOrder("COMPLETED", "CANCELLED", "PICKUP"), false);
  assert.equal(canTransitionOrder("CANCELLED", "PENDING", "PICKUP"), false);
});

test("reserves the out-for-delivery step for delivery orders", () => {
  assert.equal(
    canTransitionOrder("READY", "OUT_FOR_DELIVERY", "DELIVERY"),
    true,
  );
  assert.equal(
    canTransitionOrder("READY", "OUT_FOR_DELIVERY", "PICKUP"),
    false,
  );
  assert.deepEqual(nextOrderStatuses("READY", "PICKUP"), [
    "COMPLETED",
    "CANCELLED",
  ]);
  assert.deepEqual(nextOrderStatuses("READY", "DELIVERY"), [
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "CANCELLED",
  ]);
});
