import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = (process.argv[2] || process.env.SIGNALLINK_BASE_URL || "").replace(/\/$/, "");
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const commit = process.env.GITHUB_SHA || "local";
const runId = process.env.GITHUB_RUN_ID || "local";

function required(name, value) {
  if (!value) throw new Error(`Missing required value: ${name}`);
}

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

async function readJson(response, label) {
  const body = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error(`${label} returned non-JSON content (HTTP ${response.status})`);
  }
  if (!response.ok) throw new Error(`${label} failed (HTTP ${response.status}): ${JSON.stringify(parsed)}`);
  return parsed;
}

required("SIGNALLINK_BASE_URL or first argument", baseUrl);
required("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
required("SUPABASE_SERVICE_ROLE_KEY", serviceKey);

const healthResponse = await fetch(`${baseUrl}/api/health`, {
  headers: { "cache-control": "no-cache" }
});
const health = await readJson(healthResponse, "Health check");
if (health.status !== "ok" || health.database !== "connected") {
  throw new Error(`Health check was not production-ready: ${JSON.stringify(health)}`);
}

const payload = {
  certification: "signalink-production",
  commit,
  run_id: runId,
  purpose: "end-to-end anchor persistence and independent digest verification"
};
const expectedHash = sha256(canonicalize(payload));

const anchorResponse = await fetch(`${baseUrl}/api/anchor/create`, {
  method: "POST",
  headers: { "content-type": "application/json", "cache-control": "no-cache" },
  body: JSON.stringify({
    payload,
    metadata: {
      certification: true,
      commit,
      run_id: runId,
      source: "github-actions"
    }
  })
});
const anchor = await readJson(anchorResponse, "Anchor creation");
if (anchor.status !== "CREATED") throw new Error(`Unexpected anchor status: ${anchor.status}`);
if (anchor.hash !== expectedHash) {
  throw new Error(`Digest mismatch: API=${anchor.hash} independently_recomputed=${expectedHash}`);
}
if (!anchor.anchor_id || !anchor.signature || !anchor.timestamp) {
  throw new Error("Anchor response is missing identity, signature, or timestamp");
}

const query = new URL(`${supabaseUrl}/rest/v1/anchors`);
query.searchParams.set("anchor_id", `eq.${anchor.anchor_id}`);
query.searchParams.set("select", "anchor_id,timestamp,hash_algorithm,hash,signature,signer,metadata,created_at");
const ledgerResponse = await fetch(query, {
  headers: {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    accept: "application/json"
  }
});
const rows = await readJson(ledgerResponse, "Ledger confirmation");
if (!Array.isArray(rows) || rows.length !== 1) {
  throw new Error(`Expected exactly one ledger row for ${anchor.anchor_id}; received ${Array.isArray(rows) ? rows.length : "invalid response"}`);
}
const ledger = rows[0];
if (ledger.hash !== expectedHash || ledger.signature !== anchor.signature || ledger.hash_algorithm !== "SHA-256") {
  throw new Error("Persisted ledger record does not match the API receipt");
}

const record = {
  timestamp: Math.floor(Date.now() / 1000),
  event: "SignalLink production certification passed: build, deployment, health, anchor creation, ledger persistence, and independent SHA-256 verification",
  origin: "SignalLink Protocol LLC / SignalLink AI",
  evidence: {
    commit,
    github_run_id: runId,
    deployment_url: baseUrl,
    anchor_id: anchor.anchor_id,
    anchor_timestamp: anchor.timestamp,
    hash_algorithm: anchor.hash_algorithm,
    payload_hash: expectedHash,
    signer: ledger.signer,
    database_confirmed: true
  }
};
const packet = { record, hash: sha256(JSON.stringify(record)) };

await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/production-certification.json", `${JSON.stringify(packet, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  status: "CERTIFIED",
  deployment_url: baseUrl,
  anchor_id: anchor.anchor_id,
  payload_hash: expectedHash,
  packet_hash: packet.hash
}, null, 2));
