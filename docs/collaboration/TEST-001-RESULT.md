# TEST-001 Result — Deterministic Synthetic Contract Simulation

**Date:** 2026-09-16  
**Mode:** SYNTHETIC / LOCAL CONTRACT SIMULATION  
**Production integration:** NOT CLAIMED

## Scenario

Synthetic actor `synthetic-user-001` requests `READ` against:

`synthetic://restricted-doc/alpha`

This run tests the fluency of the four-layer contract and record linkage. It does not call real TREE, OMNIX, or Fidacy production systems.

## Event flow

~~~text
TREE
  reasoning_record_id: tree-test-001-r1
  conclusion: SUPPORTED
  digest: ee379243b973e9bfc68ff025d54cbcae9344aab2ecce9f8880ba36c714ba3beb
       |
       v
OMNIX
  decision_id: omnix-test-001-d1
  decision: ALLOW
  reason_codes: IDENTITY_OK, DELEGATION_ACTIVE, SCOPE_MATCH, STATE_FRESH
  digest: 2911701a2b0b5f4136ea01a682b447698d38d7e7a63530ea779348a4699b51c7
       |
       v
Fidacy
  grant_id: fidacy-test-001-g1
  state: ISSUED
  action: READ
  resource: synthetic://restricted-doc/alpha
  use_limit: 1
  digest: 83dc1d8f4164b1b4e42d88cafa92eca39418d1fd1185f25135eee124d2902e1e
       |
       v
Synthetic executor
  execution_id: exec-test-001-e1
  result: PERMITTED_SYNTHETIC_READ
  consumed: true
  digest: e5598edfe4400ef976fdd4951436b62376ae5fc6f2e26d53e28a6df74374826e
       |
       v
SignalLink
  receipt_id: slk-test-001
  verification_status: VALID
  receipt_digest: 5de98e9e1752b6e684115dab5b31099bcbe217521b594f86281154e80a124b46
~~~

## Mutation test

Original executor result:

`PERMITTED_SYNTHETIC_READ`

Mutation:

`DENIED`

Original execution digest:

`e5598edfe4400ef976fdd4951436b62376ae5fc6f2e26d53e28a6df74374826e`

Mutated execution digest:

`3fa5b13bbe002e2d1c3e780bc70d0e8bbdb944bacad0aea3674d868a2b318f99`

**Mutation detected: PASS**

## Contract fluency result

- TREE produced reasoning only: PASS
- OMNIX consumed TREE reference and produced governed decision only: PASS
- Fidacy consumed OMNIX decision and produced bounded grant only: PASS (simulated contract)
- Executor consumed grant without changing upstream records: PASS
- SignalLink linked hashes/IDs without rewriting upstream authority: PASS
- Stable identifiers remained separate: PASS
- One-event mutation changed the digest and was detected: PASS
- Production interoperability among independent external implementations: NOT TESTED

## Interpretation

The contract is internally fluent as a synthetic state-transition model:

~~~text
reason -> admissibility -> bounded grant -> execution state -> provenance
~~~

The next meaningful test is for each independent maintainer/system to emit its own record in the agreed schema and for SignalLink to verify the resulting chain without substituting for any upstream function.
