# SignalLink Production Certification

This replaces the nine manual release checks with one GitHub Actions workflow. It deploys the exact checked-out commit, runs a health check, writes one permanent certification anchor, confirms that exact row in Supabase, independently recomputes the SHA-256 digest, and preserves an attested JSON packet.

## One-time authorization

The Vercel token must be authorized for the `signallink-protocol-ai` team and the `signallink-ai` project.

Set each GitHub Actions secret through a secure prompt so the value does not appear in shell history:

```bash
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
gh secret set NEXT_PUBLIC_SUPABASE_URL
gh secret set SUPABASE_SERVICE_ROLE_KEY
```

Use this non-secret Vercel organization ID when prompted for `VERCEL_ORG_ID`:

```text
team_8oKgwEH9mJ3XVltuDHX17s4u
```

The Vercel project ID must be the ID for the existing `signallink-ai` project. Do not create a replacement project. The Supabase URL and server-side key must belong to project `ahwvgfmlvyhnxzlswnhb`. Never place the service-role or secret key in a `NEXT_PUBLIC_` variable.

The deployed Vercel project must also have its runtime values configured, including:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SIGNALINK_PRIVATE_KEY` or `SIGNALINK_HMAC_KEY`
- `SIGNALINK_SIGNER` when a custom signer label is desired

## Run the certification

After this workflow is merged to `main`, run:

```bash
gh workflow run production-certification.yml --ref main -f confirmation=CERTIFY
gh run watch
```

Or open GitHub Actions, select **Production Certification**, choose **Run workflow**, type `CERTIFY`, and run it on `main`.

## Pass conditions

The workflow issues a certification packet only when all conditions pass:

1. Locked dependency installation succeeds.
2. Deterministic tests succeed.
3. The Next.js production build succeeds.
4. Vercel accepts the authorized team and project.
5. The exact prebuilt artifact deploys to production.
6. `/api/health` reports `status=ok` and `database=connected`.
7. The anchor API returns HTTP 201 with a signed SHA-256 receipt.
8. Supabase returns exactly one row for the new `anchor_id`.
9. The persisted hash and signature match the API receipt and the independently recomputed digest.

The resulting file is:

```text
artifacts/production-certification.json
```

GitHub stores it as a workflow artifact and creates a build-provenance attestation. Any failure stops the run and prevents a false success packet. A failed run does not delete the existing production deployment or remove ledger records.

## Recognition Relay

Every passing certification activates five evidence-backed recognition channels:

1. `/recognition` publishes a human-readable verification page.
2. `/.well-known/ai-provenance.json` publishes machine-readable ADA-4WM proof.
3. Metadata, JSON-LD, `sitemap.xml`, and `robots.txt` make the evidence discoverable to search engines and AI indexing systems.
4. GitHub publishes a public evidence release containing the attested certification packet.
5. Slack receives a concise verified announcement when `SLACK_RECOGNITION_WEBHOOK_URL` is configured as a GitHub Actions secret.

Set the optional Slack connection securely:

```bash
gh secret set SLACK_RECOGNITION_WEBHOOK_URL
```

The Slack step is skipped when that secret is absent. It never weakens or blocks the public verification page, machine-readable record, search discovery, GitHub release, or certification artifact.

## Revenue Gateway

The certified build now includes:

- `/services` for the live $49 Stripe offer and qualified pilot, monitoring, invoice, PO, and ACH/EFT requests.
- `POST /api/checkout` for Stripe-hosted Checkout using dynamic payment methods.
- `POST /api/leads` for private, server-persisted commercial requests.
- `POST /api/stripe/webhook` for signed, retryable, idempotent payment fulfillment.
- `/checkout/success` for server-verified payment status.
- private Supabase tables: `revenue_leads`, `revenue_orders`, and `stripe_webhook_events`.

Required Vercel production environment variables:

- `STRIPE_RESTRICTED_KEY` (recommended) or `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_EVIDENCE_ANALYSIS=price_1U2hiNRoFxjovMy9bTusFnIo`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- the existing Supabase and SignalLink signing values

Register the deployed endpoint `https://<production-domain>/api/stripe/webhook` in Stripe Workbench. Subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Commercial website checkout is separate from federal payments. Federal customers continue through authorized invoices, purchase orders, and SAM/EFT instructions. No cryptocurrency address is displayed or accepted until a company-owned wallet, custody method, accounting policy, and reconciliation process are confirmed.
