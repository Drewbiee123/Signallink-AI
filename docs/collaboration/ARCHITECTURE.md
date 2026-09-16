# Architectural Boundaries

## Principle

Each system remains independently defined until an interface is documented and tested.

For a component \(S_i\):

```text
S_i : X_i -> Y_i
```

SignalLink's bounded role in this working set is:

```text
P(input, output, time, metadata) -> provenance receipt
```

This is not a claim that SignalLink replaces another system or controls its internal logic.

## Interface contract template

Each participating system should publish only:

1. input schema,
2. output schema,
3. transport or handoff method,
4. deterministic fields,
5. fields expected to change,
6. error behavior,
7. authorization boundary,
8. test vector.

## Non-assumptions

The following are not inferred from technical discussion:

- ownership,
- partnership,
- employment,
- agency,
- endorsement,
- production deployment,
- shared IP,
- exclusive rights,
- authority to speak for another party.

## Interoperability target

The preferred first experiment is a sidecar pattern:

```text
Origin System
    |
    v
Bounded Test Artifact
    |
    +--> SignalLink receipt
    |
    v
Receiving System / Independent verifier
```

The artifact and receipt should be independently recomputable without requiring trust in a private conversation.
