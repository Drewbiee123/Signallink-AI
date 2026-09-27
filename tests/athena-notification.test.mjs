import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseNotificationBundle } from "../src/lib/athena/parseNotificationBundle.ts";

const sample = JSON.parse(readFileSync(new URL("./fixtures/athena-subscription-notification.json", import.meta.url), "utf8"));

test("normalizes a FHIR Subscription notification", () => {
  const event = parseNotificationBundle(sample);
  assert.equal(event.eventId, "Subscription/example:1");
  assert.equal(event.resourceType, "DiagnosticReport");
  assert.equal(event.eventTimestamp, "2026-09-27T00:00:00.000Z");
});
test("rejects missing SubscriptionStatus", () => {
  assert.throws(() => parseNotificationBundle({ ...sample, entry: [] }), /INVALID_BUNDLE/);
});
test("rejects bad timestamps", () => {
  const bad = structuredClone(sample);
  bad.entry[0].resource.notificationEvent[0].timestamp = "not-a-time";
  assert.throws(() => parseNotificationBundle(bad), /INVALID_BUNDLE/);
});
test("allows handshake notification without focus", () => {
  const handshake = structuredClone(sample);
  handshake.entry[0].resource.type = "handshake";
  handshake.entry[0].resource.notificationEvent = [];
  assert.equal(parseNotificationBundle(handshake).resourceReference, null);
});
