# HVF / Project Ebony Phase 1 Private Ingress

Endpoint: `POST /api/hvf/v1/telemetry`

This route is isolated from SignalLink public dashboard functionality and accepts only Phase 1 drone telemetry metadata.

## Payload

```json
{
  "gps": { "latitude": 0.0, "longitude": 0.0 },
  "altitude": 0.0,
  "battery": 100,
  "timestamp": "2026-09-16T00:00:00.000Z",
  "nonce": "unique-random-value-at-least-16-chars"
}
```

No agronomic models, imagery, GLI-derived scores, or arbitrary extension fields are accepted.

## Authentication and integrity

Set `HVF_PHASE1_SHARED_SECRET` only in the production deployment secret store. Never commit it.

HVF computes `HMAC-SHA256(shared_secret, exact_raw_HTTP_body)` and sends the lowercase/uppercase hex digest in `X-HVF-Signature`.

The route rejects malformed signatures, timestamps outside a 30-second clock window, and reused nonces. Payloads are capped at 4096 bytes.

## Receipt

Successful requests return HTTP 200 with:

```json
{
  "verified": true,
  "hash": "<sha256>",
  "nonce": "<request nonce>",
  "timestamp": "<SignalLink UTC receipt time>",
  "payloadVerification": "VALID",
  "hashAlgorithm": "SHA-256"
}
```

## mTLS boundary

mTLS MUST be enforced by the production TLS ingress/reverse proxy/CDN before this application route is considered Phase 1 production-ready. Application HMAC verification is not a substitute for mTLS. Configure the edge to require and validate the HVF client certificate for this endpoint/path and reject unauthenticated clients before forwarding traffic.

## Rate limiting

The application route intentionally does not claim durable distributed rate limiting. Configure the production edge rate limiter for this path before pilot activation. A conservative initial envelope is 20 requests/second with burst 40, adjustable after HVF confirms its mirrored telemetry cadence.

## Deployment gate

Do not send production endpoint credentials to HVF until all of the following are verified: HTTPS; valid HVF client certificate required at the edge; invalid/missing client certificate rejected; HMAC valid/invalid tests; timestamp expiry test; replayed nonce test; oversized payload test; schema rejection test; rate-limit test; existing SignalLink production regression checks.
