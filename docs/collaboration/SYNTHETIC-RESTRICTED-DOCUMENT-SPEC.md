# Synthetic Restricted-Document Trust-Chain Specification

**Status:** SYNTHETIC / BOUNDED / NON-PRODUCTION  
**Version:** 0.1  
**Date:** 2026-09-16

## 1. Purpose

Define one minimal, inspectable, four-layer synthetic scenario in which reasoning, governed admissibility, technical enforcement, and provenance remain independent.

This specification is deliberately **complementary rather than monolithic**. Each system contributes one trust function. No system is required to surrender its internal architecture or proprietary implementation.

~~~text
TREE -> OMNIX -> Fidacy -> Synthetic Executor -> SignalLink
~~~

The scenario uses synthetic data only and does not authorize access to any real restricted document.

## 2. Global invariants

~~~text
Reasoning != authorization
Authorization != execution
Execution != provenance
Provenance != substantive correctness
~~~

Every layer must accept a bounded input contract, issue its own stable record ID, state its version, expose a deterministic digest or digestable record, terminate safely when required information is missing or invalid, never silently broaden upstream authority, and preserve references to upstream records.

## 3. TREE contract — reasoning

### INPUT TO TREE

- scenario/request reference;
- exact proposition/query to be evaluated;
- declared facts and assumptions;
- applicable rule-set identifier and version;
- vocabulary, syntax, and domain/universe information required by the selected logic;
- TREE engine and evaluator version.

### TREE OUTPUT

- unique stable reasoning_record_id;
- deterministic content digest for the complete reasoning record;
- conclusion status: SUPPORTED, REFUTED, or UNDETERMINED;
- normalized and inspectable representation of the input;
- explicit reasoning/evaluation trace;
- references to facts, assumptions, and rules used;
- detected conflicts, unsupported elements, and limitations;
- engine/version and evaluation timestamp.

### TREE MUST REMAIN CLOSED / UNDETERMINED

- malformed or ambiguous logical input;
- missing or unresolved rule-set version;
- unsupported syntax or logical construct;
- missing domain/universe information required for evaluation;
- contradictory premises where the selected logic cannot safely resolve them;
- mismatch between the requested proposition and produced reasoning record;
- inability to generate or verify the deterministic record digest;
- internal evaluation or validation failure.

### TREE MUST NOT CLAIM

TREE may state whether a conclusion follows from the declared facts and rules.

TREE must never state that an action is authorized, admissible, or executable.

## 4. OMNIX contract — governed admissibility

### INPUT TO OMNIX

- reference to the specific reasoning record from TREE;
- exact requested action;
- subject/actor identity context;
- authority and delegation context;
- relevant scope and current conditions;
- freshness/state information required for the decision.

### OMNIX OUTPUT

- governed decision record with a unique decision_id;
- decision state: ALLOW or HALT;
- typed reason codes;
- conditions under which the decision is valid;
- reference to the TREE reasoning record relied upon;
- decision-record digest;
- OMNIX policy/engine version and decision timestamp.

### OMNIX MUST REMAIN CLOSED / HALT

At minimum:

- missing or unverifiable TREE reasoning reference;
- stale or unresolved authority/delegation information;
- missing actor identity context;
- requested action outside declared scope;
- required current-state information unavailable;
- conflicting or expired conditions;
- decision record cannot be deterministically generated/verified;
- internal validation failure.

### OMNIX MUST NOT CLAIM

OMNIX determines whether the specific requested action is admissible under the supplied authority and conditions that exist at decision time.

OMNIX must not silently rewrite TREE reasoning, create execution authority beyond its policy inputs, or claim that execution actually occurred.

## 5. Fidacy contract — bounded technical enforcement

**Contract status:** PROPOSED pending detailed maintainer confirmation.

### INPUT TO FIDACY

Proposed minimum interface:

- OMNIX decision_id and decision digest;
- required decision state ALLOW;
- subject/actor identity;
- exact permitted action;
- exact target/resource scope;
- validity window and expiry;
- bounded-use/single-use requirement;
- executor/audience identifier;
- policy/grant version.

### FIDACY OUTPUT

Proposed minimum:

- unique grant_id;
- signed authorization grant or explicit CLOSED/HALT state;
- subject;
- action;
- scope;
- audience/executor;
- issued-at and expiry;
- use limit / single-use marker;
- OMNIX decision reference;
- grant digest/signature reference;
- revocation/consumption state where applicable.

### FIDACY MUST REMAIN CLOSED / HALT

Proposed minimum:

- OMNIX decision is not ALLOW;
- missing or unverifiable decision reference;
- expired/stale decision conditions;
- subject/action/scope mismatch;
- executor/audience mismatch;
- expired grant;
- already-consumed single-use grant;
- invalid signature/digest;
- revocation state cannot be resolved;
- internal validation failure.

### FIDACY MUST NOT CLAIM

Fidacy must not reinterpret TREE reasoning or broaden OMNIX's decision.

Its job is technical enforcement of the bounded permission supplied to it.

## 6. SignalLink contract — provenance and integrity continuity

### INPUT TO SIGNALLINK

- scenario ID;
- TREE reasoning record ID + digest;
- OMNIX decision ID + digest;
- Fidacy grant ID + digest or explicit CLOSED/HALT state;
- synthetic executor state/result;
- relevant layer versions;
- canonical event timestamps/sequence metadata.

### SIGNALLINK OUTPUT

- unique receipt_id;
- linked record identifiers;
- SHA-256 digest set;
- canonical event timeline;
- verification state: VALID or INVALID;
- boundary/version metadata;
- timestamped provenance receipt;
- mutation/tamper detection result when tested.

### SIGNALLINK MUST REMAIN CLOSED / INVALID

- missing required upstream reference;
- digest mismatch;
- broken identifier linkage;
- impossible/invalid event ordering;
- unsupported canonicalization/version;
- required artifact unavailable for verification;
- receipt-generation or validation failure.

### SIGNALLINK MUST NOT CLAIM

SignalLink may attest that the preserved records match their recorded digests and linkage.

SignalLink must not claim that TREE reasoning is substantively correct merely because its digest is valid, that OMNIX authority was legally sufficient merely because its record is intact, that Fidacy's executor is secure merely because a grant is intact, that execution was authorized beyond supplied decision/grant evidence, or that any participant is a partner or endorser.

## 7. Canonical event timeline

~~~text
T0 synthetic request created
T1 TREE evaluates proposition
T2 TREE reasoning record finalized + hashed
T3 OMNIX evaluates requested action
T4 OMNIX decision record finalized + hashed
T5 Fidacy issues bounded grant OR remains CLOSED/HALT
T6 synthetic executor consumes/rejects grant
T7 execution state finalized
T8 SignalLink records and hashes canonical chain
T9 independent verifier recomputes all digests
T10 one synthetic event is mutated
T11 verifier must detect mismatch
~~~

## 8. Minimal identifier graph

~~~text
scenario_id
   |
   +-- reasoning_record_id
   |      +-- reasoning_digest
   |
   +-- decision_id
   |      +-- reasoning_record_id_ref
   |      +-- decision_digest
   |
   +-- grant_id (or CLOSED/HALT)
   |      +-- decision_id_ref
   |      +-- grant_digest
   |
   +-- execution_state
   |
   +-- receipt_id
          +-- all upstream refs/hashes
~~~

No identifier replaces another identifier.

## 9. TEST-001 pass criteria

PASS requires:

- TREE contract satisfied;
- OMNIX contract satisfied;
- Fidacy contract satisfied or safe closed-state correctly exercised;
- SignalLink receipt generated from the actual retained artifacts;
- all original digests independently recompute;
- upstream/downstream references are intact;
- mutation of one event causes verification failure;
- no layer emits a claim outside its boundary.

Anything else is PASS only for the subset actually demonstrated and FAIL/UNDETERMINED for the rest.

## 10. Accessibility and low-complexity rule

A reviewer should be able to understand the whole scenario by reading:

1. this file,
2. one test vector,
3. one resulting receipt.

No additional service is required merely to understand the architecture.

Implementation-specific repositories, APIs, and private systems remain optional behind the defined interfaces.

## 11. Not yet claimed

This specification does not claim:

- a production integration among TREE, OMNIX, Fidacy, and SignalLink;
- a completed real-world restricted-document system;
- a formal partnership among participants;
- legal authority to access or execute against a real restricted resource;
- third-party certification;
- production stress-test completion.

The next legitimate upgrade in claim state must come from retained, reproducible evidence.
