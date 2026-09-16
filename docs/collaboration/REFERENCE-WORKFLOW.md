# Bounded Synthetic Reference Workflow

## Purpose

Run the smallest synthetic chain that exercises all four independent trust functions without collapsing them.

Canonical specification: [SYNTHETIC-RESTRICTED-DOCUMENT-SPEC.md](./SYNTHETIC-RESTRICTED-DOCUMENT-SPEC.md)

## Scenario

A synthetic actor requests an operation involving a synthetic restricted document.

~~~text
TREE:       Does the proposition follow from the declared facts and rules?
OMNIX:      Is the requested action admissible under current authority and conditions?
Fidacy:     Can that permission be technically enforced as a bounded grant?
SignalLink: What records existed at each step, and are they still intact?
~~~

## Canonical flow

~~~text
Synthetic request
      |
      v
TREE -> reasoning_record_id -> SUPPORTED | REFUTED | UNDETERMINED
      |
      v
OMNIX -> decision_id -> ALLOW | HALT
      |
      v
Fidacy -> grant_id / CLOSED / HALT
      |
      v
Synthetic executor -> execution_state
      |
      v
SignalLink -> hashes + timestamps + linked IDs -> receipt
      |
      v
Independent verifier
~~~

## Required preservation

Preserve reasoning record ID/digest/version, OMNIX decision ID/state/reasons/validity, Fidacy grant ID/scope/expiry/use-bound/signature reference when issued, execution state, SignalLink receipt ID, event hashes, timestamps, and interface versions.

## Success conditions

The test passes only if:

1. every layer accepts only the defined input contract;
2. each layer emits its own stable identifier;
3. no layer broadens previous authority;
4. closed/halt/undetermined conditions terminate safely;
5. every preserved artifact digest independently recomputes;
6. one deliberately mutated event is detected as invalid;
7. the final provenance receipt links the chain without replacing the original records.

## Failure is evidence

Record the failing boundary, expected state, observed state, input record ID, output/error state, and whether the failure is deterministic.

## Stress testing

Randomized synthetic chains and mutation testing may be added later. Until such a stress run has actually executed and retained results exist, it remains **NOT YET DEMONSTRATED**.
