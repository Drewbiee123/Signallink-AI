import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

function sha256hex(input) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function signHmac(message, secret) {
  return `hmac-sha256:${crypto.createHmac("sha256", secret).update(message).digest("base64")}`;
}

function verifyHmac(message, signature, secret) {
  if (!signature.startsWith("hmac-sha256:")) return false;
  const supplied = Buffer.from(signature.slice("hmac-sha256:".length), "base64");
  const expected = crypto.createHmac("sha256", secret).update(message).digest();
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

test("canonical object key ordering is stable", () => {
  const left = { b: 2, a: 1, nested: { z: true, y: false } };
  const right = { nested: { y: false, z: true }, a: 1, b: 2 };
  assert.equal(canonicalize(left), canonicalize(right));
  assert.equal(sha256hex(canonicalize(left)), sha256hex(canonicalize(right)));
});

test("single-value tampering changes the digest", () => {
  const baseline = { event: "GENESIS", sequence: 1, valid: true };
  const changed = { event: "GENESIS", sequence: 2, valid: true };
  assert.notEqual(sha256hex(canonicalize(baseline)), sha256hex(canonicalize(changed)));
});

test("HMAC signature accepts exact message and rejects tampering", () => {
  const secret = "test-only-secret-not-for-production";
  const hash = sha256hex(canonicalize({ event: "GENESIS", value: 42 }));
  const timestamp = "2026-08-19T04:00:00.000Z";
  const message = `${hash}|${timestamp}`;
  const signature = signHmac(message, secret);

  assert.equal(verifyHmac(message, signature, secret), true);
  assert.equal(verifyHmac(`${hash}|2026-08-19T04:00:01.000Z`, signature, secret), false);
  assert.equal(verifyHmac(`${"0".repeat(64)}|${timestamp}`, signature, secret), false);
});

test("100 deterministic payload mutations all alter SHA-256 digest", () => {
  const baseline = { event: "GENESIS-BATTLE-TEST", actor: "SignalLink", sequence: 0, metadata: { tier: "1-A" } };
  const baselineHash = sha256hex(canonicalize(baseline));
  const hashes = new Set();

  for (let i = 1; i <= 100; i += 1) {
    const mutation = { ...baseline, sequence: i };
    const digest = sha256hex(canonicalize(mutation));
    assert.notEqual(digest, baselineHash);
    hashes.add(digest);
  }

  assert.equal(hashes.size, 100);
});

test("Ed25519 signature rejects message tampering", () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const message = Buffer.from("signalink-genesis-validation");
  const signature = crypto.sign(null, message, privateKey);

  assert.equal(crypto.verify(null, message, publicKey, signature), true);
  assert.equal(crypto.verify(null, Buffer.from("signalink-genesis-validatioN"), publicKey, signature), false);
});

test("RSA-SHA256 signature rejects message tampering", () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const message = Buffer.from("signalink-genesis-validation");
  const signature = crypto.sign("sha256", message, privateKey);

  assert.equal(crypto.verify("sha256", message, publicKey, signature), true);
  assert.equal(crypto.verify("sha256", Buffer.from("signalink-genesis-validatioN"), publicKey, signature), false);
});
