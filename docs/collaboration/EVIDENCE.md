# Claims and Evidence Register

| Claim | State | Evidence boundary |
|---|---|---|
| SignalLink can represent evidence with SHA-256-based provenance and verification workflows in this repository | DEMONSTRATED | Existing repository implementation and tests |
| This public collaboration documentation exists | VERIFIED | Git commit history |
| TEST-001 defines a bounded synthetic artifact handoff | SYNTHETIC | REFERENCE-WORKFLOW.md + test vector |
| TREE is integrated with SignalLink | NOT CLAIMED | No bounded public end-to-end result recorded here |
| OMNIX is integrated with SignalLink | NOT CLAIMED | No bounded public end-to-end result recorded here |
| Fidacy is integrated with SignalLink | NOT CLAIMED | No bounded public end-to-end result recorded here |
| Any named individual or organization is a partner, employee, agent, or endorser | NOT CLAIMED | Requires explicit separate authorization |
| Combined architecture is production-ready | NOT CLAIMED | Requires production evidence beyond this working set |

## Evidence rule

Let:

```text
C_public = set of public claims
E_supportable = set of claims supported by public evidence
```

Target invariant:

```text
C_public ⊆ E_supportable
```

If evidence is ambiguous, downgrade the claim state rather than upgrading the language.
