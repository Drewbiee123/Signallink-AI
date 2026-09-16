# Open Questions and Next Steps

## Immediate

1. Confirm the public description of each external system with its maintainer.
2. Confirm who, if anyone, wants to be publicly listed as a contributor.
3. Run TEST-001 independently.
4. Publish PASS/FAIL plus the recomputed digest.
5. Record any interface discrepancy as an issue.

## After TEST-001

If the digest matches across independent implementations, add one bounded transformation step. Do not expand to a combined architecture until the preceding interface is reproducible.

## Decision criterion

Prefer the next action \(a\) that maximizes:

```text
information gain × reproducibility × option value
-------------------------------------------------
cost × dependency risk
```

This favors small reversible tests over large coupled integrations.
