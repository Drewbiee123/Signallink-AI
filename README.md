# SignalLink AI — Genesis Verification Gateway

SignalLink Protocol LLC's verifiable evidence gateway for canonical SHA-256 anchoring, timestamp/signature binding, durable anchor storage, and independent tamper verification.

## Product surface

- `POST /api/anchor/create` — canonicalizes a JSON payload, computes SHA-256, timestamps and signs the digest, and persists the receipt to the `anchors` ledger.
- `POST /api/anchor/verify` — independently recomputes the canonical digest and verifies the signature binding.
- `/anchor` — accessible browser interface for creating an anchor receipt.
- `/verify` — accessible browser interface for validating a receipt and identifying hash/signature failure.
- `/recognition` — publishes the latest completed production evidence record when one exists.
- `/.well-known/ai-provenance.json` — machine-readable public provenance relay.
- `/api/health` — protocol/database/commerce health status.

## Deterministic validation

Run:

```bash
npm ci
npm test
npm run validate:genesis
npm run build
```

`validate:genesis` creates:

- `artifacts/genesis-validation-v1.json`
- `artifacts/genesis-validation-v1.sha256`

The evidence packet covers a known SHA-256 vector, canonical key reordering, 100 deterministic payload mutations, HMAC tamper rejection, Ed25519 tamper rejection, RSA-SHA256 tamper rejection, and SHA-256 avalanche measurements. GitHub Actions preserves the generated evidence and can issue GitHub build-provenance attestations on non-PR runs.

**Validation boundary:** these are reproducible implementation-level tests. They are not NIST, C2PA, Sigstore, government, or independent third-party certification.

## Required production environment

At minimum, the anchoring gateway requires:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SIGNALINK_HMAC_KEY
```

For asymmetric signing, use:

```text
SIGNALINK_PRIVATE_KEY
SIGNALINK_PUBLIC_KEY
```

`SIGNALINK_PRIVATE_KEY` takes precedence over HMAC signing. Never commit production keys to the repository.

Optional commerce variables are handled separately from core protocol health.

## Production evidence run

When a deployment is configured, the existing Production Certification workflow can deploy the exact source candidate, check health, create a permanent anchor, independently recompute SHA-256, confirm durable ledger persistence, verify the authentic receipt, reject a payload mutation, reject timestamp tampering, attest the resulting evidence packet, and preserve the artifact.

## Security characteristics implemented

- deterministic recursive JSON canonicalization
- SHA-256 hashing
- timing-safe digest comparison
- HMAC-SHA256 verification
- Ed25519 / Ed448 support
- RSA / RSA-PSS / EC SHA-256 signing and verification
- request-size limits
- JSON nesting/complexity guards
- explicit malformed-input rejection
- fail-closed persistence behavior

## Origin

SignalLink Protocol LLC — ADA-4WM / Provenance Layer 33

CAGE: 16WJ1

> Even your house was born on your foundation.
