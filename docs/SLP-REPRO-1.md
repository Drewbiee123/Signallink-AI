# SLP-REPRO-1 — SignalLink Deterministic Reproducibility Profile

Status: Public verification profile v1

## Purpose

SLP-REPRO-1 defines the minimum language-neutral procedure required to reproduce a SignalLink public challenge result without relying on SignalLink application code or infrastructure.

This profile is intentionally narrow. It specifies deterministic JSON canonicalization and SHA-256 verification for published challenge vectors. It does not claim to be RFC 8785 and must not be described as such.

## Input

A challenge document contains a `payload` JSON value and an `expected_sha256` lowercase hexadecimal digest.

Only the `payload` value is canonicalized and hashed unless a future profile explicitly states otherwise.

## Canonicalization

For JSON values:

1. `null` serializes as `null`.
2. Booleans serialize as lowercase `true` or `false`.
3. Strings use standard JSON string escaping and UTF-8 encoding.
4. Numbers serialize as their JSON numeric representation without added whitespace.
5. Arrays preserve original element order. Each element is canonicalized recursively and separated by a comma, with no whitespace.
6. Objects sort member names lexicographically by Unicode code point order. Each key is JSON-string encoded, followed by `:`, followed by the recursively canonicalized value. Members are separated by commas, with no whitespace.
7. The complete canonical representation contains no insignificant whitespace.

For Public Reproducibility Challenge #1, the expected canonical representation is published directly in the vector and independent implementations should compare both the canonical string and digest.

## Digest

Compute SHA-256 over the UTF-8 bytes of the canonical representation and encode the resulting 32 bytes as 64 lowercase hexadecimal characters.

## PASS condition

An implementation returns PASS only when both are true:

- its canonical representation exactly equals the published `expected_canonical`; and
- its SHA-256 digest exactly equals the published `expected_sha256`.

A mismatch in either value is a FAIL and should be reported rather than normalized away.

## Challenge #1 known-answer vector

Vector: `public/challenges/federal-repro-v1.json`

Expected SHA-256:

`b325608828a14df655f1b81d3a452cbd490292e6f3b5af6cae87bb4e1f0e8c77`

Reference implementations are provided in Node.js, Python, and Go. They exist to make reproduction convenient; an independent reproduction is stronger when the evaluator implements this specification without copying a reference implementation.

## Evidence boundary

A successful reproduction demonstrates deterministic agreement under this published profile. It does not demonstrate mission effectiveness, resistance to every cryptographic or implementation attack, government approval, NIST certification, or endorsement by GitHub, GitLab, Vercel, Sigstore, or another organization.

The federal identifier in Challenge #1 is a source-reference test fixture. Authoritative federal vulnerability facts remain with NIST/NVD.
