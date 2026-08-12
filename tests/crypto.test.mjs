import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
test("canonical SHA-256 is deterministic", () => {
  const canonical = '{"a":1,"b":2}';
  assert.equal(crypto.createHash("sha256").update(canonical).digest("hex"), "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777");
});
