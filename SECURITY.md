# Security Policy

## Scope

SignalLink AI's security-sensitive surface includes cryptographic anchoring, signature verification, canonicalization, API input handling, Supabase persistence, checkout/webhook handling, and evidence publication.

## Reporting

Do not post active secrets, private keys, service-role keys, payment credentials, or exploitable production details in public issues. Report security concerns privately to SignalLink Protocol LLC through the company contact channel.

## Cryptographic boundary

The current implementation uses SHA-256 for payload hashing and supports HMAC-SHA256 plus asymmetric signing/verification pathways for Ed25519/Ed448, RSA/RSA-PSS, and EC keys. Production deployments should prefer asymmetric keys where operationally appropriate and must keep private material in a secret manager rather than source control.

## Validation language

Passing repository tests, GitHub Actions, GitHub artifact attestations, or Sigstore transparency logging demonstrates reproducible implementation behavior for the tested source and inputs. It does not by itself constitute NIST, C2PA, government, regulatory, or independent laboratory certification.

## Deployment requirements

- Keep Supabase service-role credentials server-side only.
- Keep signing keys server-side only.
- Rotate credentials on suspected exposure.
- Apply platform and database security patches on a controlled schedule.
- Preserve validation artifacts and source commit identifiers for every production evidence run.
- Use HTTPS for all deployed API traffic.

## Supported evidence expectation

An authentic verification packet should pass both digest and signature checks. Payload mutation should produce a digest mismatch. Timestamp mutation should invalidate the signature binding. Malformed or excessive requests should fail closed with controlled HTTP errors.
