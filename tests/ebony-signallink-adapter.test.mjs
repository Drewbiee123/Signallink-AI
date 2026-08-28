import assert from "node:assert/strict";
import test from "node:test";
import { createSyntheticEbonyBatch, runAdapter, sha256, validateEbonyEvent } from "../scripts/ebony-signallink-adapter.mjs";

test("builds valid RGB and dielectric-permittivity events", () => {
  const events = createSyntheticEbonyBatch({ now: new Date("2026-08-28T17:30:00.000Z"), batchId: "BATCH-TEST-001" });
  assert.equal(events.length, 2);
  assert.deepEqual(events.map((event) => event.event_type), ["rgb_optical_capture", "dielectric_permittivity_reading"]);
  for (const event of events) assert.equal(validateEbonyEvent(event), true);
  assert.match(events[0].payload.frame_bytes_sha256, /^[0-9a-f]{64}$/);
});

test("rejects live-mode telemetry before authorization", () => {
  const [event] = createSyntheticEbonyBatch();
  assert.throws(() => validateEbonyEvent({ ...event, mode: "LIVE" }), /synthetic telemetry only/);
});

test("anchors, verifies, and exports a two-event evidence object", async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    const body = JSON.parse(options.body); calls.push({ url, body });
    if (url.endsWith("/api/anchor/create")) return new Response(JSON.stringify({ anchor_id: `slk_${calls.length}`, timestamp: "2026-08-28T17:30:01.000Z", hash: sha256(body.payload), signature: "demo-signature", status: "CREATED" }), { status: 201 });
    return new Response(JSON.stringify({ status: "VALID", hash_valid: true, signature_valid: true, computed_hash: body.hash }), { status: 200 });
  };
  const events = createSyntheticEbonyBatch({ now: new Date("2026-08-28T17:30:00.000Z"), batchId: "BATCH-TEST-002" });
  const evidence = await runAdapter({ fetchImpl: fakeFetch, baseUrl: "https://signal.test", events, writeEvidence: false });
  assert.equal(evidence.event_count, 2); assert.equal(calls.length, 4);
  assert.equal(evidence.results.every((result) => result.verification.status === "VALID"), true);
  assert.match(evidence.evidence_sha256, /^[0-9a-f]{64}$/);
  assert.equal(calls[0].body.metadata.raw_payload_sha256, sha256(events[0].payload));
});
