#!/usr/bin/env node
// Usage: node verify-media-receipt.mjs receipt.json original-file public-key.pem
import { readFileSync } from "node:fs";
import { createHash, createPublicKey, verify } from "node:crypto";

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

const [receiptPath, filePath, keyPath] = process.argv.slice(2);
if (!receiptPath || !filePath || !keyPath) {
  process.stderr.write("Usage: node verify-media-receipt.mjs receipt.json original-file public-key.pem\n");
  process.exit(2);
}
try {
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  const fileDigest = createHash("sha256").update(readFileSync(filePath)).digest("hex");
  const payloadDigest = createHash("sha256").update(canonicalize(receipt.payload)).digest("hex");
  const pem = readFileSync(keyPath, "utf8");
  const keyDigest = createHash("sha256").update(pem).digest("hex");
  const publicKey = createPublicKey(pem);
  const algorithm = ["ed25519", "ed448"].includes(publicKey.asymmetricKeyType) ? null : "sha256";
  const signatureValid = verify(algorithm, Buffer.from(`${receipt.hash}|${receipt.timestamp}`), publicKey, Buffer.from(receipt.signature, "base64"));
  const checks = {
    file_hash_matches: fileDigest === receipt.payload?.file?.sha256,
    receipt_hash_matches: payloadDigest === receipt.hash,
    signing_key_matches: keyDigest === receipt.payload?.signing_key_sha256,
    timestamp_matches: receipt.timestamp === receipt.payload?.scanned_at,
    signature_valid: signatureValid
  };
  const valid = Object.values(checks).every(Boolean);
  process.stdout.write(`${JSON.stringify({ status: valid ? "VALID" : "INVALID", checks }, null, 2)}\n`);
  process.exit(valid ? 0 : 1);
} catch (error) {
  process.stderr.write(`Verification failed: ${error instanceof Error ? error.message : "unknown error"}\n`);
  process.exit(1);
}
