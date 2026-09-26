# SignalLink AI — Genesis Verification Gateway

SignalLink Protocol LLC's verifiable evidence gateway for canonical SHA-256 anchoring, timestamp/signature binding, durable anchor storage, and independent tamper verification.

## Public reproducibility challenge

**Challenge #1 is open:** reproduce a published federal source-state SHA-256 result without trusting SignalLink's server.

- Challenge page: `/challenge`
- Test vector: `/challenges/federal-repro-v1.json`
- Open review thread: https://github.com/Drewbiee123/Signallink-AI/issues/9
- One-command reference verifier: `node scripts/reproduce-federal-challenge.mjs`
- Expected SHA-256: `b325608828a14df655f1b81d3a452cbd490292e6f3b5af6cae87bb4e1f0e8c77`

Independent participants are encouraged to reproduce the result using their own implementation and post PASS/FAIL plus their canonical string and digest in the public issue. A successful reproduction demonstrates deterministic cross-implementation agreement only; it is not government or third-party certification or endorsement.

## Product surface

- `POST /api/anchor/create` — canonicalizes a JSON payload, computes SHA-256, timestamps and signs the digest, and persists the receipt to the `anchors` ledger.
- `POST /api/anchor/verify` — independently recomputes the canonical digest and verifies the signature binding.
- `/anchor` — accessible browser interface for creating an anchor receipt.
- `/verify` — accessible browser interface for validating a receipt and identifying hash/signature failure.
- `/federal` — Federal Mission Assurance Gateway using authoritative federal-source data with explicit SignalLink analysis boundaries.
- `/challenge` — public third-party reproducibility challenge.
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

## Consumer media scanner release gate

`/scanner` accepts media up to 10 MB and returns a SHA-256 file fingerprint, CAI C2PA validation findings, an asymmetric signature, and a downloadable offline verifier. The uploaded file is not stored. The receipt does not establish human or AI authorship. SynthID and calibrated anomaly classification are not connected and are marked `NOT_CHECKED`.

Apply `supabase/migrations/20260926181601_scanner_commerce.sql` before enabling scans. Configure `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SIGNALINK_PRIVATE_KEY`, and `SIGNALINK_PUBLIC_KEY`. Free access also requires `SIGNALINK_FREE_QUOTA_KEY` on Vercel. The database transaction records the anchor and spends a scan together; only `service_role` may call the metering functions.

Consumer checkout remains closed until both `SIGNALINK_SCANNER_BILLING_ENABLED=true` and `NEXT_PUBLIC_SCANNER_BILLING_ENABLED=true` are set. Configure Stripe credentials and a verified webhook at `/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, and `charge.dispute.created`. Configure the Stripe Billing Portal if offering its management link. The available products are 10 scans for $4.99 and unlimited monthly scans for $9.99, subject to 15 scans per minute to prevent abuse. They include file fingerprinting, C2PA validation, and signed receipts only.

The buyer's random bearer access key is saved in the browser; save it separately for other devices. The verified Stripe webhook grants access only after payment is confirmed. `/scanner/support` records key recovery and payment requests in `revenue_leads`; an operator must monitor and respond to them. Automated recovery is not implemented. Before enabling payments, test that recovery path, refund and cancellation events, webhook retries, the signing key, and an upload-to-receipt-to-offline-verification flow in a Stripe sandbox and production preview.
