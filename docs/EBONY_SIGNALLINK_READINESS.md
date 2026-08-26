# Ebony × SignalLink Integration Readiness

## Status

SignalLink has prepared a synthetic, non-proprietary adapter for the public HVF / Project Ebony onboarding architecture.

This work is intentionally limited to synthetic telemetry until Humphrey Virtual Farms authorizes the live telemetry handshake and provides the agreed endpoint/schema details.

## Current boundary

- No HVF proprietary telemetry is ingested.
- No Ebony private architecture is reproduced.
- No SignalLink private signing material is transferred to HVF.
- No live RTMP/WebRTC feed is contacted.
- No claim of third-party, government, or external attestation is made.

## Intended runtime path

Ebony event / telemetry
→ SignalLink adapter
→ `POST /api/anchor/create`
→ SignalLink receipt
→ `POST /api/anchor/verify`
→ verification result returned to the integration layer

## Synthetic test

Run against an existing SignalLink deployment:

```bash
SIGNALLINK_BASE_URL=http://localhost:3000 node scripts/ebony-signallink-adapter.mjs
```

The synthetic event is clearly marked `SYNTHETIC_ONLY` and is designed only to prove the SignalLink-side integration path before the live HVF handshake.

## Next authorized step

Upon receipt of the HVF live-handshake parameters:

1. Map the authorized Ebony event schema to the adapter.
2. Add authentication required by the agreed endpoint.
3. Perform one controlled live event test.
4. Generate the first SignalLink receipt.
5. Verify the same receipt independently through `/api/anchor/verify`.
6. Preserve the resulting evidence packet and document all remaining boundaries.

## Provenance boundary

A successful synthetic test demonstrates only that SignalLink can accept, anchor, and verify an Ebony-shaped event through its existing API surface. It does not prove access to Ebony's private runtime, a live drone connection, or validation by Humphrey Virtual Farms until those events actually occur.
