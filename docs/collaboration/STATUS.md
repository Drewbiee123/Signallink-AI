# Where We Are Now

**Status date:** 2026-09-16

## Current architecture state

The collaboration has converged on a bounded four-function model for a **synthetic restricted-document scenario**:

~~~text
TREE -> OMNIX -> Fidacy -> SignalLink
~~~

- **TREE:** reasoning/evaluation against declared facts, assumptions, rules, logic/vocabulary, and engine version.
- **OMNIX:** governed admissibility of a requested action under identity, authority/delegation, scope, conditions, and fresh state.
- **Fidacy:** proposed technical enforcement boundary for a signed, bounded, short-lived, single-use grant. Detailed implementation contract remains subject to the Fidacy maintainer's confirmation.
- **SignalLink:** independent provenance, digest verification, event continuity, and tamper-evident recording of the reasoning/authority/execution state.

## Confirmed design principle

No layer is permitted to collapse the trust function of another layer.

~~~text
Reasoning != authorization
Authorization != execution
Execution != provenance
Provenance != correctness or authority
~~~

## Current collaboration state

- Four-layer responsibility separation: **DEMONSTRATED AS A DOCUMENTED DESIGN**
- TREE boundary: **PROPOSED / DOCUMENTED, NOT FROZEN** — field-by-field classification pending: EXISTS NATIVELY / DERIVABLE / REQUIRES ADAPTER / NOT YET IMPLEMENTED
- OMNIX boundary: **PROPOSED / DOCUMENTED**
- Fidacy execution-enforcement concept: **PROPOSED**, detailed owner contract still required
- SignalLink provenance/verification capability in this repository: **DEMONSTRATED**
- Synthetic test vector and workflow: **SYNTHETIC**
- Multi-system end-to-end run: **NOT YET DEMONSTRATED**
- Production deployment of a combined architecture: **NOT CLAIMED**
- Formal partnership, ownership, agency, or organizational integration: **NOT CLAIMED**

## Current gate

Do not add another architectural layer.

The next gate is one reproducible synthetic transaction that preserves the four contracts and produces a verifiable SignalLink receipt.

## Rule for updates

Change this file when evidence changes. Do not infer status from conversation membership, profile visibility, silence, enthusiasm, or informal participation.
