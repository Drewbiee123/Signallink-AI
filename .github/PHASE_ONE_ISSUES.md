Phase One — SignalLink Genesis MVP: Issues

This file contains the granular issues for Phase One implementation. Use the included script .github/create_phase_one_issues.sh to create these GitHub Issues via the GitHub CLI (gh). Each issue includes suggested labels and acceptance criteria.

--

1) Anchor API: Implement /api/anchor/create
Title: Anchor API — implement POST /api/anchor/create
Body:
- Description: Implement the Anchor creation endpoint that accepts content, metadata, requester, and model info. It must canonicalize input, compute SHA-256, sign the canonical payload with Ed25519, store an immutable record, and return a JSON verification packet.

Acceptance criteria:
- POST /api/anchor/create returns 201 with id, hash, timestamp, signature, signer key id, metadata, verify_url.
- Uses canonical JSON (documented) before hashing.
- Signing key stored in env/secret manager.
- Unit tests for hashing, signature, and API contract.
- Integration test that calls endpoint and verifies signature using published public key.

Labels: backend, priority:high, feature
Assignees: @Drewbiee123

--

2) Verification API: Implement /verify
Title: Verification API — implement POST /verify
Body:
- Description: Stateless verification endpoint that accepts anchor proof (id, hash, signature, timestamp, signer) and returns VERIFIED/INVALID/EXPIRED/MODIFIED.

Acceptance criteria:
- POST /verify returns proper status and details field.
- Stateless verification: only needs public key(s) and the proof — no hidden server state for cryptographic validation.
- Public key discovery URL documented and reachable.
- Unit tests covering successful verification and failure modes.

Labels: backend, priority:high, feature
Assignees: @Drewbiee123

--

3) AI Completion Proxy: Implement /api/chat
Title: AI Completion Proxy — implement POST /api/chat
Body:
- Description: Proxy that forwards prompts to model provider, receives completion, creates an anchor automatically, and returns the response + verification packet.

Acceptance criteria:
- Returns output + anchor object (id, hash, timestamp, signature, verify_url).
- Error handling for model provider failures and anchor creation failures.
- End-to-end integration test: prompt -> model (mock) -> anchor -> verify (VERIFIED).

Labels: backend, integration, priority:high
Assignees: @Drewbiee123

--

4) Public Verification Page
Title: Public Verification Page — implement /verify/[id]
Body:
- Description: Human-readable read-only page to display anchor record and verification status.

Acceptance criteria:
- Page shows id, timestamp, hash, signature, metadata, verification result.
- No editing allowed. Read-only UI.
- Linkable and shareable URL.

Labels: frontend, feature, priority:medium
Assignees: @Drewbiee123

--

5) Demo Interface & Landing Page
Title: Demo Interface — interactive demo and landing page
Body:
- Description: Professional landing page with interactive prompt box, generated response, verification proof, copy/verify buttons, mobile friendly.

Acceptance criteria:
- Interactive demo calls /api/chat and shows verification UI.
- Clean mobile-responsive design, fast load.
- Landing content explains value proposition and links to docs.

Labels: frontend, ux, priority:medium
Assignees: @Drewbiee123

--

6) Canonicalization & Hashing Spec
Title: Canonicalization & Hashing — define canonical JSON and hashing rules
Body:
- Description: Document the exact canonicalization (JCS/RFC8785 or chosen) and the fields included in the hash. Provide sample inputs and expected hash outputs.

Acceptance criteria:
- Spec in repo (docs/canonicalization.md).
- Unit tests validating canonicalization and expected SHA-256 outputs.

Labels: docs, backend, priority:high
Assignees: @Drewbiee123

--

7) Key Management & Public Key Discovery
Title: Key Management — implement signing key handling and public key discovery
Body:
- Description: Store signing keys in env/secret manager, publish public keys at a stable HTTPS URL with key ids for verification.

Acceptance criteria:
- .well-known endpoint or static JSON published: /.well-known/signalink-keys.json
- Key rotation documented.
- Tests for verification against published keys.

Labels: security, ops, priority:high
Assignees: @Drewbiee123

--

8) Testing & CI
Title: CI & Tests — add unit/integration tests and CI workflow
Body:
- Description: Add GitHub Actions workflow to run lint, unit tests, integration tests (mock model provider) and build demo front end.

Acceptance criteria:
- CI runs on push and PR; tests pass.
- Integration test for full flow.

Labels: ci, infra, priority:high
Assignees: @Drewbiee123

--

9) Rate Limiting & Abuse Protection
Title: Rate Limiting — implement rate limiting and basic abuse controls
Body:
- Description: Add per-IP and per-API-key rate limiting middleware, size limits for inputs, and monitoring for spikes.

Acceptance criteria:
- Rate limits enforced and tested.
- Configurable via env vars.

Labels: backend, security, priority:medium
Assignees: @Drewbiee123

--

10) Secure Headers & HTTPS Enforcement
Title: Security Headers & TLS — enforce HTTPS and secure headers
Body:
- Description: Implement HSTS, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, and other recommended headers.

Acceptance criteria:
- Headers present in responses.
- Documentation lists headers.

Labels: security, ops, priority:medium
Assignees: @Drewbiee123

--

11) Deployment & Health Checks
Title: Deployment & Monitoring — deploy production build, health endpoint, monitoring
Body:
- Description: Deploy to production environment, expose /health, add basic monitoring and error tracking integration.

Acceptance criteria:
- /health returns OK and required metrics.
- Monitoring alert configured for error rate.

Labels: ops, priority:high
Assignees: @Drewbiee123

--

12) Documentation & SDK Examples
Title: Docs & SDKs — README, OpenAPI, JS/Python SDK examples
Body:
- Description: Publish API docs (OpenAPI), quickstart, and SDK snippets for JavaScript and Python with cURL examples.

Acceptance criteria:
- OpenAPI spec present in repo.
- README quickstart works locally.

Labels: docs, priority:medium
Assignees: @Drewbiee123

--

13) Security Review & Pen Test Prep
Title: Security Review — run internal security review and prepare for pen test
Body:
- Description: Audit code for secrets, dependency vulnerabilities, and prepare documentation and scope for penetration test.

Acceptance criteria:
- Secret scanning clean.
- Vulnerability report generated.

Labels: security, priority:high
Assignees: @Drewbiee123

--

14) Example Enterprise Integration
Title: Enterprise Integration Example — sample SSO/API-key flow and onboarding guide
Body:
- Description: Provide an example integration guide showing API key management, SSO considerations, and enterprise onboarding steps.

Acceptance criteria:
- Integration docs and sample code.

Labels: docs, enterprise, priority:medium
Assignees: @Drewbiee123

--
