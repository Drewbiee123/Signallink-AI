#!/bin/bash
# Creates Phase One issues for SignalLink Genesis MVP using GitHub CLI (gh).
# Usage: run with GH CLI authenticated (gh auth login) from repository root.

set -e

create_issue(){
  local title="$1"
  local body="$2"
  local labels="$3"
  gh issue create --title "$title" --body "$body" --label "$labels"
}

# Read in issues from the PHASE_ONE_ISSUES.md content blocks
# For reliability, we will create issues explicitly here.

create_issue "Anchor API — implement POST /api/anchor/create" "Description: Implement the Anchor creation endpoint that accepts content, metadata, requester, and model info. It must canonicalize input, compute SHA-256, sign the canonical payload with Ed25519, store an immutable record, and return a JSON verification packet.\n\nAcceptance criteria:\n- POST /api/anchor/create returns 201 with id, hash, timestamp, signature, signer key id, metadata, verify_url.\n- Uses canonical JSON (documented) before hashing.\n- Signing key stored in env/secret manager.\n- Unit tests for hashing, signature, and API contract.\n- Integration test that calls endpoint and verifies signature using published public key." "backend,feature,priority:high"

create_issue "Verification API — implement POST /verify" "Description: Stateless verification endpoint that accepts anchor proof (id, hash, signature, timestamp, signer) and returns VERIFIED/INVALID/EXPIRED/MODIFIED.\n\nAcceptance criteria:\n- POST /verify returns proper status and details field.\n- Stateless verification: only needs public key(s) and the proof — no hidden server state for cryptographic validation.\n- Public key discovery URL documented and reachable.\n- Unit tests covering successful verification and failure modes." "backend,feature,priority:high"

create_issue "AI Completion Proxy — implement POST /api/chat" "Description: Proxy that forwards prompts to model provider, receives completion, creates an anchor automatically, and returns the response + verification packet.\n\nAcceptance criteria:\n- Returns output + anchor object (id, hash, timestamp, signature, verify_url).\n- Error handling for model provider failures and anchor creation failures.\n- End-to-end integration test: prompt -> model (mock) -> anchor -> verify (VERIFIED)." "backend,integration,priority:high"

create_issue "Public Verification Page — implement /verify/[id]" "Description: Human-readable read-only page to display anchor record and verification status.\n\nAcceptance criteria:\n- Page shows id, timestamp, hash, signature, metadata, verification result.\n- No editing allowed. Read-only UI.\n- Linkable and shareable URL." "frontend,feature,priority:medium"

create_issue "Demo Interface — interactive demo and landing page" "Description: Professional landing page with interactive prompt box, generated response, verification proof, copy/verify buttons, mobile friendly.\n\nAcceptance criteria:\n- Interactive demo calls /api/chat and shows verification UI.\n- Clean mobile-responsive design, fast load.\n- Landing content explains value proposition and links to docs." "frontend,ux,priority:medium"

create_issue "Canonicalization & Hashing — define canonical JSON and hashing rules" "Description: Document the exact canonicalization (JCS/RFC8785 or chosen) and the fields included in the hash. Provide sample inputs and expected hash outputs.\n\nAcceptance criteria:\n- Spec in repo (docs/canonicalization.md).\n- Unit tests validating canonicalization and expected SHA-256 outputs." "docs,backend,priority:high"

create_issue "Key Management — implement signing key handling and public key discovery" "Description: Store signing keys in env/secret manager, publish public keys at a stable HTTPS URL with key ids for verification.\n\nAcceptance criteria:\n- .well-known endpoint or static JSON published: /.well-known/signalink-keys.json\n- Key rotation documented.\n- Tests for verification against published keys." "security,ops,priority:high"

create_issue "CI & Tests — add unit/integration tests and CI workflow" "Description: Add GitHub Actions workflow to run lint, unit tests, integration tests (mock model provider) and build demo front end.\n\nAcceptance criteria:\n- CI runs on push and PR; tests pass.\n- Integration test for full flow." "ci,infra,priority:high"

create_issue "Rate Limiting — implement rate limiting and basic abuse controls" "Description: Add per-IP and per-API-key rate limiting middleware, size limits for inputs, and monitoring for spikes.\n\nAcceptance criteria:\n- Rate limits enforced and tested.\n- Configurable via env vars." "backend,security,priority:medium"

create_issue "Security Headers & TLS — enforce HTTPS and secure headers" "Description: Implement HSTS, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, and other recommended headers.\n\nAcceptance criteria:\n- Headers present in responses.\n- Documentation lists headers." "security,ops,priority:medium"

create_issue "Deployment & Monitoring — deploy production build, health endpoint, monitoring" "Description: Deploy to production environment, expose /health, add basic monitoring and error tracking integration.\n\nAcceptance criteria:\n- /health returns OK and required metrics.\n- Monitoring alert configured for error rate." "ops,priority:high"

create_issue "Docs & SDKs — README, OpenAPI, JS/Python SDK examples" "Description: Publish API docs (OpenAPI), quickstart, and SDK snippets for JavaScript and Python with cURL examples.\n\nAcceptance criteria:\n- OpenAPI spec present in repo.\n- README quickstart works locally." "docs,priority:medium"

create_issue "Security Review — run internal security review and prepare for pen test" "Description: Audit code for secrets, dependency vulnerabilities, and prepare documentation and scope for penetration test.\n\nAcceptance criteria:\n- Secret scanning clean.\n- Vulnerability report generated." "security,priority:high"

create_issue "Enterprise Integration Example — sample SSO/API-key flow and onboarding guide" "Description: Provide an example integration guide showing API key management, SSO considerations, and enterprise onboarding steps.\n\nAcceptance criteria:\n- Integration docs and sample code." "docs,enterprise,priority:medium"

echo "Phase One issue creation script finished. Review issues on GitHub to assign or adjust labels as needed."
