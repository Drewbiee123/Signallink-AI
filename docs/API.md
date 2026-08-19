# SignalLink Genesis Gateway API

## Create anchor

`POST /api/anchor/create`

Request:

```json
{
  "payload": {
    "event": "GENESIS-LIVE-001"
  },
  "metadata": {
    "source": "customer-system"
  }
}
```

Success: `201 Created`

```json
{
  "anchor_id": "slk_<uuid>",
  "timestamp": "2026-08-19T05:00:00.000Z",
  "hash_algorithm": "SHA-256",
  "hash": "<64-hex-character-digest>",
  "signature": "<signature>",
  "status": "CREATED"
}
```

The supplied payload is recursively canonicalized before hashing. The signature binds `hash|timestamp`. The record is persisted to the configured Supabase `anchors` table before success is returned.

## Verify anchor

`POST /api/anchor/verify`

Request:

```json
{
  "payload": {
    "event": "GENESIS-LIVE-001"
  },
  "timestamp": "2026-08-19T05:00:00.000Z",
  "hash": "<64-hex-character-digest>",
  "signature": "<signature>"
}
```

Authentic result: `200 OK`

```json
{
  "status": "VALID",
  "hash_algorithm": "SHA-256",
  "computed_hash": "<64-hex-character-digest>",
  "hash_valid": true,
  "signature_valid": true
}
```

Integrity failure: `422 Unprocessable Entity`

```json
{
  "status": "INVALID",
  "hash_algorithm": "SHA-256",
  "computed_hash": "<recomputed-digest>",
  "hash_valid": false,
  "signature_valid": false
}
```

## Error behavior

- `400` — malformed JSON, required field missing, invalid timestamp, or payload complexity/depth violation.
- `413` — request exceeds the configured request-size ceiling.
- `422` — structurally valid verification packet fails integrity/authenticity verification.
- `503` — anchoring persistence is not configured.
- `500` — unexpected server failure; secrets are not returned in the error body.

## Health

`GET /api/health`

Core protocol readiness is based on signing configuration plus database connectivity. Commerce configuration is reported separately so optional Stripe configuration does not redefine whether the cryptographic gateway itself is operational.

## Verification invariant

For the same supported JSON value, canonicalization must be deterministic. An authentic packet must satisfy both:

1. `SHA256(canonicalize(payload)) == supplied hash`
2. the configured signing method validates the signature over `hash|timestamp`

A changed payload should fail the digest check. A changed timestamp should fail the signature check even when the payload hash remains unchanged.
