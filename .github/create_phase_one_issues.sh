#!/usr/bin/env bash
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
MILESTONE_TITLE='SignalLink Genesis MVP — Anchor & Verify + Verifiable AI Proxy'

# Ensure milestone exists (create if missing) and get number
MILESTONE_JSON=$(gh api repos/"$REPO"/milestones --jq ".[] | select(.title==\"$MILESTONE_TITLE\")" || true)
if [[ -z "$MILESTONE_JSON" ]]; then
  echo "Creating milestone: $MILESTONE_TITLE"
  gh api repos/"$REPO"/milestones -f title="$MILESTONE_TITLE" -f description="Production milestone for Anchor API, Verification API, AI Completion Proxy, verification UI, and demonstration interface. See docs/REVENUE_SPRINT_SIGNALINK_GENESIS_MVP.md." -f due_on="2026-09-30T23:59:59Z"
fi
MILESTONE_NUMBER=$(gh api repos/"$REPO"/milestones --jq ".[] | select(.title==\"$MILESTONE_TITLE\").number")

# Define issues: title|body|labels
read -r -d '' ISSUES <<'ISSUES_EOF'
Anchor API — implement POST /api/anchor/create|Implement Anchor creation endpoint: canonicalize input, compute SHA-256, sign payload with Ed25519, store immutable record, return JSON verification packet.|backend,feature,priority:high
Verification API — implement POST /verify|Stateless verification endpoint accepting id, hash, signature, timestamp and returning VERIFIED/INVALID/EXPIRED/MODIFIED. Public key discovery documented.|backend,feature,priority:high
AI Completion Proxy — implement POST /api/chat|Proxy to forward prompts, receive completion, create anchor automatically, return response+verification packet. End-to-end integration test required.|backend,integration,priority:high
Public Verification Page — implement /verify/[id]|Read-only human page displaying id, timestamp, hash, signature, metadata, verification result. Linkable & shareable.|frontend,feature,priority:medium
Demo Interface — interactive demo and landing page|Landing page + interactive prompt demo calling /api/chat and showing verification proof. Mobile friendly, copy/verify buttons.|frontend,ux,priority:medium
Canonicalization & Hashing — define canonical JSON and hashing rules|Document chosen canonicalization (JCS/RFC8785 or chosen) and fields included in hash; include sample inputs & expected hashes.|docs,backend,priority:high
Key Management — implement signing key handling and public key discovery|Store signing keys in secret manager, publish public keys at /.well-known/signalink-keys.json, document rotation.|security,ops,priority:high
CI & Tests — add unit/integration tests and CI workflow|Add GitHub Actions to run lint, unit tests, integration tests (mock model), and build demo front end.|ci,infra,priority:high
Rate Limiting — implement rate limiting and basic abuse controls|Per-IP and per-API-key rate limiting, input size limits, configurable via env vars.|backend,security,priority:medium
Security Headers & TLS — enforce HTTPS and secure headers|Implement HSTS, CSP, X-Frame-Options, X-Content-Type-Options. Document header list.|security,ops,priority:medium
Deployment & Monitoring — deploy production build, health endpoint, monitoring|Expose /health, add monitoring, integrate error tracking, configure alert for error rate.|ops,priority:high
Docs & SDKs — README, OpenAPI, JS/Python SDK examples|Publish OpenAPI spec, README quickstart, and SDK snippets for JS/Python with cURL examples.|docs,priority:medium
Security Review — run internal security review and prepare for pen test|Audit for secrets, dependency vulnerabilities, and prepare scope for pen test.|security,priority:high
Enterprise Integration Example — sample SSO/API-key flow and onboarding guide|Provide integration guide showing API key management and SSO considerations.|docs,enterprise,priority:medium
ISSUES_EOF

# Loop through and create or update each issue; attach milestone
echo "$ISSUES" | while IFS='|' read -r TITLE BODY LABELS; do
  echo "Processing issue: $TITLE"
  ISSUE_NUM=$(gh issue list --repo "$REPO" --limit 200 --search "$TITLE" --json number --jq '.[0].number' 2>/dev/null || true)
  if [[ -n "$ISSUE_NUM" ]] && [[ "$ISSUE_NUM" != "null" ]]; then
    echo "Updating existing issue #$ISSUE_NUM"
    gh issue edit "$ISSUE_NUM" --repo "$REPO" --title "$TITLE" --body "$BODY" --label "$LABELS" --milestone "$MILESTONE_NUMBER" || true
  else
    echo "Creating issue: $TITLE"
    gh issue create --repo "$REPO" --title "$TITLE" --body "$BODY" --label "$LABELS" --milestone "$MILESTONE_NUMBER"
  fi
done

echo "All Phase One issues processed. Milestone: $MILESTONE_TITLE (#$MILESTONE_NUMBER)"
