# Architectural Boundaries

## Design objective

Provide a useful combined workflow **without creating a monolith**.

~~~text
TREE       -> logical support/refutation/undetermined
OMNIX      -> governed allow/halt decision
Fidacy     -> bounded execution grant/enforcement
SignalLink -> provenance, continuity, integrity verification
~~~

Each layer owns one responsibility and exports only the minimum evidence required by the next boundary.

## TREE boundary — reasoning

TREE evaluates an exact proposition/query against declared facts, assumptions, a versioned rule set, logic vocabulary/syntax, domain/universe information, and an identified TREE engine/evaluator version.

Expected conclusion state:

~~~text
SUPPORTED | REFUTED | UNDETERMINED
~~~

TREE may state whether a conclusion follows from the declared facts and rules.

TREE **must not** state that an action is authorized, admissible, or executable.

## OMNIX boundary — governed admissibility

OMNIX receives a reference to a specific TREE reasoning record plus the exact requested action, subject/actor identity context, authority/delegation context, relevant scope/current conditions, and freshness/state information.

Expected decision state:

~~~text
ALLOW | HALT
~~~

OMNIX emits a governed decision record with its own decision ID, typed reason codes, and explicit validity conditions.

OMNIX evaluates admissibility; it does not silently become the reasoning engine or execution mechanism.

## Fidacy boundary — execution enforcement

The presently documented concept is:

> Can the resulting permission be technically enforced at the executor through a signed, bounded, short-lived, single-use grant?

Until its maintainer supplies the full contract, Fidacy remains **PROPOSED** at this layer.

The minimum safe interface should require a reference to the OMNIX decision ID, authorized subject/actor, exact permitted action, target/resource scope, validity window/expiry, bounded-use semantics, executor/audience, and a cryptographic grant identifier/signature.

Fidacy must not reinterpret TREE reasoning or broaden OMNIX authority.

## SignalLink boundary — evidence continuity

SignalLink receives references/digests for the relevant reasoning, authority, grant, and execution-state artifacts and records a tamper-evident provenance chain.

~~~text
P(events, hashes, timestamps, metadata, boundary_refs) -> provenance receipt
~~~

SignalLink does not create the reasoning conclusion, invent authority, or authorize execution.

## Anti-collapse invariants

~~~text
TREE.reasoning_record_id != OMNIX.decision_id
OMNIX.decision_id         != Fidacy.grant_id
Fidacy.grant_id           != SignalLink.receipt_id
~~~

Each identifier remains independently attributable and linkable. A valid downstream record must reference the upstream record it relied upon rather than replacing it.

## Minimal interface contract

Every layer must define:

1. INPUT
2. OUTPUT
3. MUST REMAIN CLOSED / HALT / UNDETERMINED
4. MUST NOT CLAIM
5. deterministic/reference identifiers
6. version information
7. freshness/expiry behavior where applicable
8. error behavior

## Non-assumptions

Technical participation does not imply partnership, employment, agency, endorsement, shared IP, production deployment, exclusive rights, or authority to speak for another participant.
