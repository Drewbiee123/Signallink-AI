# Acceptance criteria

- An operator can provide a manifest with a workflow identifier, UTC capture time, at least one source identifier and source-content SHA-256, and an answer SHA-256.
- Validation rejects malformed digests, absent fields, invalid timestamps, empty source lists, unexpected fields, duplicate source identifiers, and non-JSON values.
- Canonically equivalent manifests produce the same SHA-256 regardless of JSON object key order. A changed digest or source identifier produces a different result.
- No network access or upload occurs when the SDK stub is called.
- A future adapter must distinguish `prepared`, `submitted`, and `verified` states; it must not report `verified` until independent receipt validation succeeds.
- Any real NotebookLM ingestion must document the authorized export path, privacy handling, source byte definition, error handling, and a reproducible test fixture before release.
- The documentation must avoid claims of source truth, Google endorsement, autonomous collection, or live deployment based solely on the manifest hash.
