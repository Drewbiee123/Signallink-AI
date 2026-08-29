#!/usr/bin/env node

import { createHash, generateKeyPairSync, sign, verify } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createSyntheticEbonyBatch } from "./ebony-signallink-adapter.mjs";

export function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

export function hash(value) {
  return createHash("sha256").update(typeof value === "string" ? value : canonicalize(value)).digest("hex");
}

export async function generatePublicEvidence({ outputPath = resolve("public/evidence/ebony-signallink-synthetic.json") } = {}) {
  const generatedAt = new Date().toISOString();
  const batchId = `EBONY-SIGNALLINK-PUBLIC-${generatedAt.replace(/[-:.TZ]/g, "")}`;
  const events = createSyntheticEbonyBatch({ now: new Date(generatedAt), batchId });
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();

  const results = events.map((event) => {
    const canonicalEvent = canonicalize(event);
    const signature = sign(null, Buffer.from(canonicalEvent), privateKey).toString("base64");
    const signatureValid = verify(null, Buffer.from(canonicalEvent), publicKey, Buffer.from(signature, "base64"));
    return {
      event,
      raw_payload_sha256: hash(event.payload),
      canonical_event_sha256: hash(canonicalEvent),
      ed25519_signature_base64: signature,
      signature_valid: signatureValid,
      tamper_test_rejected: !verify(null, Buffer.from(`${canonicalEvent} `), publicKey, Buffer.from(signature, "base64"))
    };
  });

  const evidence = {
    schema: "signallink.ebony.public-evidence.v1",
    generated_at: generatedAt,
    integration: "Project Ebony x SignalLink",
    mode: "SYNTHETIC_ONLY",
    source_boundary: "Public HVF onboarding concepts only; no private HVF telemetry or runtime access",
    batch_id: batchId,
    hash_algorithm: "SHA-256",
    signature_algorithm: "Ed25519",
    public_key_pem: publicKeyPem,
    event_count: results.length,
    results,
    verification_summary: {
      all_payload_hashes_present: results.every((result) => /^[0-9a-f]{64}$/.test(result.raw_payload_sha256)),
      all_signatures_valid: results.every((result) => result.signature_valid),
      all_tamper_tests_rejected: results.every((result) => result.tamper_test_rejected),
      adapter_api_path_tested: true,
      live_webrtc_handshake_completed: false
    }
  };
  evidence.evidence_sha256 = hash(evidence);
  await mkdir(resolve(outputPath, ".."), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  return evidence;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const evidence = await generatePublicEvidence();
  console.log(`PASS ${evidence.event_count} synthetic events signed and verified`);
  console.log(`Evidence SHA-256: ${evidence.evidence_sha256}`);
}
