# NotebookLM guardrail integration package

This package defines a proposed boundary for recording evidence from a NotebookLM-assisted workflow. It is a design and SDK stub, not an active NotebookLM integration or a claim of Google endorsement.

## Workflow

1. An authorized operator exports or supplies the source references and generated answer. Do not put credentials, private documents, or unrestricted source text into a public repository.
2. The caller constructs a manifest conforming to `manifest.schema.json`. Source identifiers and content digests must be computed from material the caller actually possesses. A URL alone does not prove what content was used.
3. `src/lib/notebooklm-guardrail.mjs` validates the manifest envelope and returns a deterministic SHA-256 digest of its canonical JSON representation. This is an unsigned local integrity check.
4. A future adapter may submit that digest and the manifest to SignalLink's anchor API with operator authorization. The adapter must preserve the resulting receipt and verify it independently before reporting an anchor as complete.

## Limits

The stub does not connect to NotebookLM, retrieve source documents, validate claims against sources, call the anchor API, sign receipts, or establish when Google generated an answer. A digest shows equality of supplied bytes under the chosen canonicalization; it does not establish the truth or origin of those bytes.

See [acceptance criteria](ACCEPTANCE.md) for implementation gates and the [schema](manifest.schema.json) for the proposed interchange format.
