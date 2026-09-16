# Provenance Model

## Minimum receipt fields

A bounded receipt should identify:

```json
{
  "event_id": "TEST-001",
  "source_hash": "<sha256>",
  "received_at": "<UTC timestamp>",
  "verification_status": "VALID|INVALID",
  "interface_version": "1"
}
```

## Digest rule

For canonical message bytes \(M\):

```text
H = SHA256(M)
```

An independent verifier should be able to recompute \(H\) from the published artifact.

## What provenance proves

Within the tested procedure, provenance can provide evidence of artifact identity, ordering, timestamp association, and tamper detection.

## What provenance does not prove by itself

A matching digest does not independently prove:

- that a person authored the content,
- that a business relationship exists,
- that a model's output is correct,
- that an external system is secure,
- that a regulator or government body certified the system.

Those require separate evidence.
