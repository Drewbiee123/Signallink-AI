# Open Questions and Next Steps

## Principle

Do not add moving parts unless they remove more uncertainty than they create.

The architecture already has the required four trust functions. The next work is interface precision and one reproducible native-record handoff.

## Immediate

1. **TREE:** classify every proposed field as `EXISTS NATIVELY / DERIVABLE / REQUIRES ADAPTER / NOT YET IMPLEMENTED`; freeze the TREE contract only after that review is complete.
2. **OMNIX:** confirm which documented fields are native runtime outputs versus derivable/adapter fields before describing the OMNIX interface as frozen.
3. **Fidacy:** request/confirm the detailed owner-maintained contract using the same `INPUT / OUTPUT / MUST REMAIN CLOSED / MUST NOT CLAIM` structure.
4. **SignalLink:** keep its contract frozen around provenance/integrity only; do not absorb upstream reasoning, admissibility, or enforcement.
5. Normalize confirmed field classifications into the canonical synthetic specification.
6. Run the next test using at least one **native external-system record** rather than only a local boundary representation.
7. Independently recompute all available digests.
8. Mutate one retained event and verify detection.
9. Publish PASS / FAIL / UNDETERMINED by layer without upgrading untested claims.

## Progress metric

Let each proposed interface field belong to exactly one class:

~~~text
N = EXISTS NATIVELY
D = DERIVABLE
A = REQUIRES ADAPTER
U = NOT YET IMPLEMENTED
~~~

For a layer with total fields F:

~~~text
Native coverage      = N / F
Available coverage   = (N + D + A) / F
Implementation gap   = U / F
Adapter dependency   = A / F
~~~

A boundary is eligible to be called **frozen** only when:

~~~text
N + D + A + U = F
~~~

and every field has a maintainer-confirmed classification.

This prevents architectural confidence from exceeding measured interface knowledge.

## Do not do yet

- no additional conceptual layers,
- no grand integration claim,
- no production claim,
- no organizational merger/partnership inference,
- no real restricted document,
- no real authority grant,
- no live executor action.

## Decision criterion

~~~text
information gain × reproducibility × interoperability × option value
--------------------------------------------------------------------
implementation cost × coupling × dependency risk × claim risk
~~~

The strongest next action is the smallest run that replaces one synthetic boundary representation with one native maintainer-generated record while leaving the other layers unchanged.
