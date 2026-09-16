# Claims and Evidence Register

| Claim | State | Evidence boundary |
|---|---|---|
| A four-function TREE → OMNIX → Fidacy → SignalLink responsibility model has been documented | DEMONSTRATED AS DOCUMENTATION | Canonical synthetic specification + architecture docs |
| TREE is bounded to reasoning/evaluation rather than authorization/execution | DOCUMENTED / PROPOSED | Supplied TREE boundary |
| OMNIX is bounded to governed admissibility with ALLOW/HALT output | DOCUMENTED / PROPOSED | Supplied OMNIX boundary |
| Fidacy is intended to enforce a signed, bounded, short-lived, single-use permission at the executor | PROPOSED | Concept stated in collaboration record; detailed maintainer contract still required |
| SignalLink can represent evidence with SHA-256-based provenance and verification workflows in this repository | DEMONSTRATED | Existing repository implementation/tests |
| TEST-001 defines a bounded synthetic artifact handoff | SYNTHETIC | Reference workflow + test vector |
| TREE and OMNIX have completed a real technical integration | NOT CLAIMED | No retained end-to-end result here |
| OMNIX and Fidacy have completed a real technical integration | NOT CLAIMED | No retained end-to-end result here |
| Fidacy and SignalLink have completed a real technical integration | NOT CLAIMED | No retained end-to-end result here |
| The four-layer chain has passed a production stress test | NOT CLAIMED | Stress run not retained as completed evidence |
| Any named participant is a partner, employee, agent, or endorser | NOT CLAIMED | Requires explicit separate authorization |
| Combined architecture is production-ready | NOT CLAIMED | Requires production evidence beyond this working set |

## Evidence invariant

~~~text
C_public = set of public claims
E_supportable = set of claims supported by retained evidence
C_public ⊆ E_supportable
~~~

## Boundary invariant

A downstream artifact may reference an upstream determination but must not silently upgrade it.

~~~text
TREE = SUPPORTED
does not imply
OMNIX = ALLOW

OMNIX = ALLOW
does not imply
Fidacy grant issued

Fidacy grant issued
does not imply
execution succeeded

SignalLink receipt VALID
does not imply
the underlying reasoning or policy was substantively correct
~~~

If evidence is ambiguous, downgrade the claim state rather than upgrade the language.
