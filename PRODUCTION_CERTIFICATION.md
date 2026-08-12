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
