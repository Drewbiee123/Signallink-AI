import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function hammingBits(hexA, hexB) {
  const a = Buffer.from(hexA, "hex");
  const b = Buffer.from(hexB, "hex");
  let bits = 0;
  for (let i = 0; i < a.length; i += 1) {
    let x = a[i] ^ b[i];
    while (x) {
      bits += x & 1;
      x >>>= 1;
    }
  }
  return bits;
}

const baseline = {
  event: "GENESIS-BATTLE-TEST",
  origin: "SignalLink Protocol LLC / SignalLink AI",
  framework: "ADA-4WM",
  assurance_tier: "Tier 1-A",
  provenance_layer: 33,
  anchor_method: "SHA-256",
  anchor_phrase: "Even your house was born on your foundation.",
  sequence: 0,
  metadata: { purpose: "reproducible protocol validation" }
};

const baselineCanonical = canonicalize(baseline);
const baselineHash = sha256(baselineCanonical);
const mutationResults = [];
const uniqueHashes = new Set();
for (let i = 1; i <= 100; i += 1) {
  const mutation = { ...baseline, sequence: i };
  const digest = sha256(canonicalize(mutation));
  uniqueHashes.add(digest);
  mutationResults.push({
    sequence: i,
    hash: digest,
    differs_from_baseline: digest !== baselineHash,
    hamming_distance_bits: hammingBits(baselineHash, digest)
  });
}

const reordered = {
  provenance_layer: 33,
  anchor_phrase: "Even your house was born on your foundation.",
  assurance_tier: "Tier 1-A",
  anchor_method: "SHA-256",
  metadata: { purpose: "reproducible protocol validation" },
  sequence: 0,
  framework: "ADA-4WM",
  origin: "SignalLink Protocol LLC / SignalLink AI",
  event: "GENESIS-BATTLE-TEST"
};

const hmacSecret = "signalink-genesis-ci-test-secret";
const timestamp = "2026-08-19T05:00:00.000Z";
const signedMessage = `${baselineHash}|${timestamp}`;
const hmac = crypto.createHmac("sha256", hmacSecret).update(signedMessage).digest();
const hmacAltered = crypto.createHmac("sha256", hmacSecret).update(`${baselineHash}|2026-08-19T05:00:01.000Z`).digest();

const ed = crypto.generateKeyPairSync("ed25519");
const edMessage = Buffer.from(signedMessage);
const edSignature = crypto.sign(null, edMessage, ed.privateKey);

const rsa = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const rsaSignature = crypto.sign("sha256", edMessage, rsa.privateKey);

const averageHamming = mutationResults.reduce((sum, item) => sum + item.hamming_distance_bits, 0) / mutationResults.length;
const checks = {
  known_sha256_vector: sha256('{"a":1,"b":2}') === "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777",
  canonical_key_reordering: sha256(canonicalize(reordered)) === baselineHash,
  mutations_changed_digest: mutationResults.every((item) => item.differs_from_baseline),
  mutations_unique: uniqueHashes.size === 100,
  hmac_authentic: crypto.timingSafeEqual(hmac, crypto.createHmac("sha256", hmacSecret).update(signedMessage).digest()),
  hmac_timestamp_tamper_rejected: !crypto.timingSafeEqual(hmac, hmacAltered),
  ed25519_authentic: crypto.verify(null, edMessage, ed.publicKey, edSignature),
  ed25519_tamper_rejected: !crypto.verify(null, Buffer.from(`${baselineHash}|2026-08-19T05:00:01.000Z`), ed.publicKey, edSignature),
  rsa_sha256_authentic: crypto.verify("sha256", edMessage, rsa.publicKey, rsaSignature),
  rsa_sha256_tamper_rejected: !crypto.verify("sha256", Buffer.from(`${baselineHash}|2026-08-19T05:00:01.000Z`), rsa.publicKey, rsaSignature)
};

const passed = Object.values(checks).filter(Boolean).length;
const failed = Object.keys(checks).length - passed;
const record = {
  schema: "signallink.genesis.validation.v1",
  generated_at: new Date().toISOString(),
  source_commit: process.env.GITHUB_SHA || "local",
  github_run_id: process.env.GITHUB_RUN_ID || "local",
  runtime: { node: process.version, platform: process.platform, arch: process.arch },
  origin: "SignalLink Protocol LLC / SignalLink AI",
  framework: "ADA-4WM",
  provenance_layer: 33,
  assurance_tier: "Tier 1-A",
  validation_scope: "deterministic implementation-level cryptographic and tamper tests; not third-party certification",
  baseline: { canonical: baselineCanonical, sha256: baselineHash },
  checks,
  mutation_summary: {
    attempted: 100,
    changed_digest: mutationResults.filter((item) => item.differs_from_baseline).length,
    unique_hashes: uniqueHashes.size,
    average_hamming_distance_bits: Number(averageHamming.toFixed(2)),
    minimum_hamming_distance_bits: Math.min(...mutationResults.map((item) => item.hamming_distance_bits)),
    maximum_hamming_distance_bits: Math.max(...mutationResults.map((item) => item.hamming_distance_bits))
  },
  outcome: { passed, failed, status: failed === 0 ? "PASS" : "FAIL" },
  mutations: mutationResults
};

const packet = { record, hash: sha256(JSON.stringify(record)) };
await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/genesis-validation-v1.json", `${JSON.stringify(packet, null, 2)}\n`, "utf8");
await writeFile("artifacts/genesis-validation-v1.sha256", `${packet.hash}  genesis-validation-v1.json\n`, "utf8");

console.log(JSON.stringify({
  status: record.outcome.status,
  passed,
  failed,
  baseline_hash: baselineHash,
  packet_hash: packet.hash,
  mutation_summary: record.mutation_summary
}, null, 2));

if (failed > 0) process.exit(1);
