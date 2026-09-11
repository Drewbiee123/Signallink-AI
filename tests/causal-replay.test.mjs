import test from "node:test";
import assert from "node:assert/strict";
import { createCausalReplayReceipt, firstReplayDivergence, verifyCausalReplayReceipt } from "../src/lib/causal-replay.mjs";

const baseline = [
  { step: "identity", outcome: "Drewbiee123" },
  { step: "repo_read", outcome: "allowed" },
  { step: "contents_write", outcome: "allowed" },
  { step: "issue_write", outcome: "allowed" }
];

const observed = [
  { step: "identity", outcome: "Drewbiee123" },
  { step: "repo_read", outcome: "allowed" },
  { step: "contents_write", outcome: "403 Resource not accessible by integration" },
  { step: "issue_write", outcome: "not_attempted" }
];

test("identifies the first divergence and actor class", () => {
  const result = firstReplayDivergence(baseline, observed);
  assert.equal(result.index, 2);
  assert.equal(result.actor_class, "INTEGRATION_PERMISSION");
});

test("creates and verifies a restored-baseline replay receipt", () => {
  const packet = createCausalReplayReceipt({ workflow_id: "notebooklm-guardrail", baseline, observed, replay: baseline }, "test-secret");
  assert.equal(packet.record.status, "DIVERGED");
  assert.equal(packet.record.replay_verdict, "BASELINE_RESTORED");
  assert.equal(verifyCausalReplayReceipt(packet, "test-secret").valid, true);
});

test("detects record tampering", () => {
  const packet = createCausalReplayReceipt({ workflow_id: "notebooklm-guardrail", baseline, observed }, "test-secret");
  packet.record.status = "MATCHED";
  assert.equal(verifyCausalReplayReceipt(packet, "test-secret").valid, false);
});
