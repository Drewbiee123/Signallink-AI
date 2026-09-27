import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseNotificationBundle } from "../src/lib/athena/parseNotificationBundle.ts";
import { createHmac } from "node:crypto";
import { signatureReady, verifyAthenaSignature } from "../src/lib/athena/signature.ts";

const sample = JSON.parse(readFileSync(new URL("./fixtures/athena-subscription-notification.json", import.meta.url), "utf8"));

test("normalizes a FHIR Subscription notification", () => {
  const event = parseNotificationBundle(sample);
  assert.equal(event.eventId, "Subscription/example:sample-audit-event");
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
test("verifies the documented X-Hub-Signature and rejects tampering", async () => {
  const prior = process.env.ATHENA_WEBHOOK_SIGNING_SECRET;
  process.env.ATHENA_WEBHOOK_SIGNING_SECRET = "test-only-shared-secret";
  try {
    assert.equal(signatureReady(), true);
    const body = Buffer.from('{"resourceType":"Bundle"}');
    const digest = createHmac("sha256", process.env.ATHENA_WEBHOOK_SIGNING_SECRET).update(body).digest("hex");
    const headers = new Headers({ "X-Hub-Signature": `sha256=${digest}` });
    assert.equal(await verifyAthenaSignature(body, headers), true);
    assert.equal(await verifyAthenaSignature(Buffer.from("altered"), headers), false);
    assert.equal(await verifyAthenaSignature(body, new Headers({ "X-Hub-Signature": `sha1=${digest}` })), false);
  } finally {
    if (prior === undefined) delete process.env.ATHENA_WEBHOOK_SIGNING_SECRET;
    else process.env.ATHENA_WEBHOOK_SIGNING_SECRET = prior;
  }
});
