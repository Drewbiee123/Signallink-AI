# SignalLink Provenance Model

## Purpose

SignalLink records continuity of the synthetic chain without taking over TREE reasoning, OMNIX admissibility, or Fidacy enforcement.

## Canonical event lineage

~~~text
TREE reasoning record
        |
        v
OMNIX decision record
        |
        v
Fidacy grant / closed state
        |
        v
execution state
        |
        v
SignalLink provenance receipt
~~~

## Minimum receipt fields

~~~json
{
  "receipt_id": "slk-test-001",
  "scenario_id": "TEST-001",
  "reasoning_record_id": "<TREE id>",
  "reasoning_record_digest": "<sha256>",
  "decision_id": "<OMNIX id>",
  "decision_digest": "<sha256>",
  "grant_id": "<Fidacy id or null>",
  "grant_digest": "<sha256 or null>",
  "execution_state": "<synthetic state>",
  "event_hashes": ["<sha256>"],
  "received_at": "<UTC timestamp>",
  "verification_status": "VALID|INVALID",
  "interface_version": "1"
}
~~~

## Digest rule

For canonical bytes of each artifact M_i:

~~~text
H_i = SHA256(M_i)
~~~

The final receipt links the hashes; it does not replace source artifacts.

## Independent verification

A verifier should be able to obtain public synthetic artifacts, canonicalize them using the declared method, recompute each digest, verify identifier linkage, confirm expected ordering, detect a changed artifact, and distinguish missing evidence from invalid evidence.

## Provenance invariants

~~~text
reasoning hash change  -> receipt verification must fail
decision hash change   -> receipt verification must fail
grant hash change      -> receipt verification must fail
execution-state change -> receipt verification must fail
~~~

## What SignalLink can establish within this test

Subject to retained artifacts and the verification method: artifact identity, event ordering, timestamp association, cross-boundary references, tamper detection, and whether the preserved chain still matches recorded digests.

## What SignalLink does not prove by itself

A valid receipt does not independently prove that TREE's conclusion is substantively correct beyond TREE's model, that OMNIX authority data was legally sufficient, that Fidacy's executor is secure, that a human authored an artifact, that a business relationship exists, or that any regulator certified the system.
