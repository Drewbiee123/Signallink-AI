# Bounded Synthetic Reference Workflow

## Purpose

Create one small end-to-end test that maximizes information gained while minimizing integration risk.

## Test vector

Use the sample artifact in [vectors/test-001.json](./vectors/test-001.json).

Canonical test flow:

1. Read the JSON artifact.
2. Canonicalize it using the agreed serialization rule.
3. Compute SHA-256 over the canonical bytes.
4. Record the resulting digest, timestamp, and source metadata.
5. Pass the original artifact plus digest to an independent participant.
6. Independently recompute the digest.
7. Compare values.

Success condition:

```text
H_origin == H_receiver
```

A passing result demonstrates artifact identity across the tested boundary. It does **not** prove complete system integration, production readiness, security of unrelated components, or organizational partnership.

## Expansion rule

Only after TEST-001 passes should a transformation step be added:

```text
M0 -> System A -> M1 -> System B -> M2
```

For each transition, preserve:

```text
H(M0), H(M1), H(M2), timestamps, interface version, test identifier
```

## Failure handling

A failure is useful evidence. Record the exact failing boundary, expected behavior, observed behavior, and whether the failure is deterministic.
