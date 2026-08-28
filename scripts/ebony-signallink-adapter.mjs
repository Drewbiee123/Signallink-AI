#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE_URL = "http://localhost:3000";

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

export function sha256(value) {
  return createHash("sha256").update(typeof value === "string" ? value : canonicalize(value)).digest("hex");
}

export function createSyntheticEbonyBatch({ now = new Date(), batchId } = {}) {
  const timestamp = now.toISOString();
  const id = batchId || `EBONY-SYNTH-${now.getTime()}`;
  const common = { schema: "signallink.ebony.telemetry.v1", source: "HVF_EBONY", batch_id: id, timestamp, mode: "SYNTHETIC_ONLY", device_id: "EBONY-DEMO-NODE", zone_id: "ZONE-1-NORTH" };
  return [
    { ...common, event_id: `${id}-RGB-001`, event_type: "rgb_optical_capture", payload: { media_type: "image/rgb+synthetic", width_px: 1920, height_px: 1080, channel_mean: { red: 0.31, green: 0.56, blue: 0.24 }, green_leaf_index: 0.42, latitude: 35.4712, longitude: -98.3541, altitude_m: 50.0, frame_bytes_sha256: sha256("HVF-SYNTHETIC-RGB-FRAME-001") } },
    { ...common, event_id: `${id}-DP-001`, event_type: "dielectric_permittivity_reading", payload: { sensor_id: "HVF-DP-SYNTH-001", relative_permittivity: 18.7, frequency_hz: 1000000, soil_temperature_c: 27.5, volumetric_water_content_pct: 21.4, calibration: "SYNTHETIC_BASELINE_V1" } }
  ];
}

export function validateEbonyEvent(event) {
  for (const field of ["schema", "source", "batch_id", "event_id", "timestamp", "event_type", "device_id", "zone_id"]) {
    if (typeof event?.[field] !== "string" || event[field].length === 0) throw new Error(`event is missing ${field}`);
  }
  if (event.schema !== "signallink.ebony.telemetry.v1") throw new Error("unsupported Ebony telemetry schema");
  if (event.mode !== "SYNTHETIC_ONLY") throw new Error("adapter currently accepts synthetic telemetry only");
  if (!Number.isFinite(Date.parse(event.timestamp))) throw new Error("event timestamp is invalid");
  if (!event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) throw new Error("event payload must be an object");
  if (event.event_type === "rgb_optical_capture") {
    if (!/^[0-9a-f]{64}$/.test(event.payload.frame_bytes_sha256 || "")) throw new Error("RGB frame hash is invalid");
    if (![event.payload.width_px, event.payload.height_px, event.payload.green_leaf_index].every(Number.isFinite)) throw new Error("RGB metrics are invalid");
  } else if (event.event_type === "dielectric_permittivity_reading") {
    if (![event.payload.relative_permittivity, event.payload.frequency_hz, event.payload.soil_temperature_c].every(Number.isFinite)) throw new Error("dielectric metrics are invalid");
  } else throw new Error(`unsupported event type: ${event.event_type}`);
  return true;
}

async function postJson(fetchImpl, baseUrl, path, body, apiKey) {
  const headers = { "content-type": "application/json" };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  const response = await fetchImpl(`${baseUrl}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(`${path} failed (${response.status}): ${JSON.stringify(data)}`);
  return data;
}

export async function runAdapter({ fetchImpl = fetch, baseUrl = DEFAULT_BASE_URL, apiKey, events = createSyntheticEbonyBatch(), writeEvidence = true, evidencePath = resolve("evidence/ebony-signallink-synthetic.json") } = {}) {
  const results = [];
  for (const event of events) {
    validateEbonyEvent(event);
    const rawPayloadHash = sha256(event.payload);
    const createResult = await postJson(fetchImpl, baseUrl.replace(/\/$/, ""), "/api/anchor/create", { payload: event, metadata: { integration: "HVF_EBONY", mode: "SYNTHETIC_ONLY", batch_id: event.batch_id, event_type: event.event_type, raw_payload_sha256: rawPayloadHash } }, apiKey);
    for (const field of ["anchor_id", "timestamp", "hash", "signature"]) if (typeof createResult[field] !== "string" || !createResult[field]) throw new Error(`create response is missing ${field}`);
    const verifyResult = await postJson(fetchImpl, baseUrl.replace(/\/$/, ""), "/api/anchor/verify", { payload: event, timestamp: createResult.timestamp, hash: createResult.hash, signature: createResult.signature }, apiKey);
    if (verifyResult.status !== "VALID" || verifyResult.hash_valid !== true || verifyResult.signature_valid !== true) throw new Error(`verification did not return VALID for ${event.event_id}`);
    results.push({ event, raw_payload_sha256: rawPayloadHash, anchor: createResult, verification: verifyResult });
  }
  const evidence = { schema: "signallink.ebony.evidence.v1", generated_at: new Date().toISOString(), integration: "HVF_EBONY", mode: "SYNTHETIC_ONLY", batch_id: events[0]?.batch_id, event_count: results.length, results };
  evidence.evidence_sha256 = sha256(evidence);
  if (writeEvidence) { await mkdir(dirname(evidencePath), { recursive: true }); await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8"); }
  return evidence;
}

async function main() {
  const baseUrl = (process.env.SIGNALLINK_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const evidencePath = resolve(process.env.EBONY_EVIDENCE_PATH || "evidence/ebony-signallink-synthetic.json");
  console.log("=== Ebony -> SignalLink Synthetic Telemetry Test ===");
  const evidence = await runAdapter({ baseUrl, apiKey: process.env.SIGNALLINK_API_KEY, evidencePath });
  for (const result of evidence.results) console.log(`PASS ${result.event.event_type}: ${result.anchor.anchor_id} (${result.anchor.hash})`);
  console.log(`Evidence: ${evidencePath}`);
  console.log(`Evidence SHA-256: ${evidence.evidence_sha256}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) main().catch((error) => { console.error("FAIL:", error.message); process.exitCode = 1; });
