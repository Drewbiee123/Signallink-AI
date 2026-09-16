# Collaboration Working Set

This directory is the public entry point for the bounded TREE → OMNIX → Fidacy → SignalLink synthetic trust-chain work.

The design goal is **maximum clarity with minimum moving parts**: one canonical scenario specification, one reference workflow, one evidence register, and supporting status/provenance notes. Nothing here implies completed integration, partnership, agency, endorsement, shared ownership, or production readiness.

## Read this first

1. [SYNTHETIC-RESTRICTED-DOCUMENT-SPEC.md](./SYNTHETIC-RESTRICTED-DOCUMENT-SPEC.md) — **canonical four-layer contract**
2. [REFERENCE-WORKFLOW.md](./REFERENCE-WORKFLOW.md) — the smallest executable synthetic chain
3. [EVIDENCE.md](./EVIDENCE.md) — what is demonstrated, proposed, or not claimed
4. [STATUS.md](./STATUS.md) — current state and next gate

Supporting material:

- [ARCHITECTURE.md](./ARCHITECTURE.md) — responsibility separation and interfaces
- [PROVENANCE.md](./PROVENANCE.md) — SignalLink receipt and verification rules
- [COLLABORATION.md](./COLLABORATION.md) — participation/consent boundary
- [NEXT-STEPS.md](./NEXT-STEPS.md) — execution sequence

## Four independent trust functions

~~~text
TREE       = reasoning
OMNIX      = governed admissibility
Fidacy     = bounded execution enforcement
SignalLink = provenance and integrity continuity
~~~

The chain is complementary because each layer answers a different question and is prohibited from silently absorbing the responsibility of another layer.

## Claim-state vocabulary

- **VERIFIED** — independently reproducible or supported by published evidence.
- **DEMONSTRATED** — shown in a bounded test.
- **SYNTHETIC** — simulated/non-production scenario or data.
- **EXPERIMENTAL** — implemented but not production-ready.
- **PROPOSED** — interface or behavior awaiting confirmation/test.
- **NOT CLAIMED** — explicitly outside the current evidence boundary.

**Governing invariant:** public claims must not exceed public evidence.
