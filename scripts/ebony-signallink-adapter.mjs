#!/usr/bin/env node

/**
 * Ebony -> SignalLink synthetic integration adapter.
 *
 * Purpose:
 * - Exercise SignalLink's existing /api/anchor/create and /api/anchor/verify APIs
 * - Use synthetic telemetry only until Humphrey Virtual Farms authorizes the live handshake
 * - Keep Ebony proprietary internals and SignalLink signing material separated
 *
 * Usage:
 *   SIGNALINK_BASE_URL=http://localhost:3000 node scripts/ebony-signallink-adapter.mjs
 */

const baseUrl = (process.env.SIGNALLINK_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const syntheticEbonyEvent = {
  schema: "signallink.ebony.synthetic.v1",
  source: "HVF_EBONY",
  event_id: `EBONY-SYNTH-${Date.now()}`,
  timestamp: new Date().toISOString(),
  event_type: "synthetic_telemetry",
  device_id: "EBONY-DEMO-NODE",
  payload: {
    mode: "pre-handshake",
    optical_ingestion: "NOT_CONNECTED",
    telemetry_status: "SYNTHETIC_ONLY",
    action: "integration_readiness_test",
    note: "No HVF proprietary telemetry or private Ebony data is used in this test."
  }
};

async function postJson(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${path} failed (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

async function main() {
  console.log("=== Ebony -> SignalLink Synthetic Readiness Test ===");
  console.log(`SignalLink base URL: ${baseUrl}`);
  console.log(`Event ID: ${syntheticEbonyEvent.event_id}`);

  // SignalLink create expects an AnchorRequest wrapper with a payload property.
  const createResult = await postJson("/api/anchor/create", {
    payload: syntheticEbonyEvent,
    metadata: {
      integration: "HVF_EBONY",
      mode: "SYNTHETIC_ONLY",
      purpose: "pre-handshake readiness"
    }
  });

  console.log("\n[1/2] Anchor created:");
  console.log(JSON.stringify(createResult, null, 2));

  const required = ["timestamp", "hash", "signature"];
  for (const field of required) {
    if (typeof createResult[field] !== "string" || !createResult[field]) {
      throw new Error(`create response is missing required field: ${field}`);
    }
  }

  // SignalLink verify expects payload + timestamp + hash + signature at top level.
  const verifyResult = await postJson("/api/anchor/verify", {
    payload: syntheticEbonyEvent,
    timestamp: createResult.timestamp,
    hash: createResult.hash,
    signature: createResult.signature
  });

  console.log("\n[2/2] Verification result:");
  console.log(JSON.stringify(verifyResult, null, 2));

  if (verifyResult.status !== "VALID" || verifyResult.hash_valid !== true || verifyResult.signature_valid !== true) {
    throw new Error(`verification did not return VALID: ${JSON.stringify(verifyResult)}`);
  }

  console.log("\nPASS: Synthetic Ebony-shaped event completed the SignalLink anchor/verify loop.");
  console.log("Boundary: This is not a live HVF telemetry handshake or third-party attestation.");
}

main().catch((error) => {
  console.error("\nFAIL:", error.message);
  process.exitCode = 1;
});
