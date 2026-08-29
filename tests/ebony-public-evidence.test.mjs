import assert from "node:assert/strict";
import { createPublicKey, verify } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { canonicalize, hash } from "../scripts/generate-ebony-public-evidence.mjs";

test("published Ebony evidence is internally verifiable", async () => {
  const evidence = JSON.parse(await readFile(new URL("../public/evidence/ebony-signallink-synthetic.json", import.meta.url), "utf8"));
  const expectedEvidenceHash = evidence.evidence_sha256;
  delete evidence.evidence_sha256;
  assert.equal(hash(evidence), expectedEvidenceHash);
  assert.equal(evidence.mode, "SYNTHETIC_ONLY");
  assert.equal(evidence.event_count, 2);
  const publicKey = createPublicKey(evidence.public_key_pem);
  for (const result of evidence.results) {
    const canonicalEvent = canonicalize(result.event);
    assert.equal(hash(result.event.payload), result.raw_payload_sha256);
    assert.equal(hash(canonicalEvent), result.canonical_event_sha256);
    assert.equal(verify(null, Buffer.from(canonicalEvent), publicKey, Buffer.from(result.ed25519_signature_base64, "base64")), true);
    assert.equal(verify(null, Buffer.from(`${canonicalEvent} `), publicKey, Buffer.from(result.ed25519_signature_base64, "base64")), false);
  }
});
