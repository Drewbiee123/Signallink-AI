# Open Questions and Next Steps

## Principle

Do not add moving parts unless they remove more uncertainty than they create.

The architecture already has the required four trust functions. The next work is interface precision and one reproducible run.

## Immediate

1. Freeze TREE contract from the supplied boundary.
2. Freeze OMNIX contract from the supplied boundary.
3. Request/confirm Fidacy's detailed owner-maintained contract using the same INPUT / OUTPUT / MUST REMAIN CLOSED / MUST NOT CLAIM structure.
4. Freeze SignalLink contract around provenance only.
5. Normalize all four into the canonical synthetic specification.
6. Run TEST-001 through the smallest possible synthetic chain.
7. Independently recompute all digests.
8. Mutate one event and verify detection.
9. Publish PASS/FAIL without upgrading the claim language.

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

The strongest next action is the smallest run that exercises **all four boundaries** while keeping every layer replaceable and independently testable.
