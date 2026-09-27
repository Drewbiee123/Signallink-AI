# Athenahealth Event Gateway (Preview)

Endpoint: https://aiprov.org/api/athena/webhook

Preview FHIR base: https://api.preview.platform.athenahealth.com/fhir/r4
Production FHIR base: https://api.platform.athenahealth.com/fhir/r4

This is an incomplete, fail-closed integration. The signature adapter currently always rejects. The queue requires an external durable HTTPS receiver; the repository does not yet provide a consumer. No production approval or athenahealth credentials are present. Do not configure a live subscription yet.

## Setup

1. Apply `migrations/20260927_athena.sql` to the configured Supabase database.
2. Set `ATHENA_ENV=preview`, `ATHENA_CLIENT_ID`, `ATHENA_CLIENT_SECRET`, `ATHENA_TOKEN_URL`, `ATHENA_ADMIN_TOKEN`, `ATHENA_QUEUE_ENDPOINT`, and `ATHENA_QUEUE_TOKEN` on the server. Existing Supabase service credentials are also required.
3. Confirm athenahealth's exact signature headers, signed-byte input, algorithm, timestamp/replay rules, and key rotation; implement and test `src/lib/athena/signature.ts` before accepting any messages.
4. Connect an authenticated durable worker to process event IDs and implement retry/dead-letter handling. Confirm the queue API and its durability guarantee. Do not send PHI to an unreviewed queue.
5. Use the protected `/api/athena/topics` endpoint to discover actual topics, then create a standards-compliant Subscription after validating athenahealth-specific constraints.

The Preview scopes provided in onboarding are `system/SubscriptionTopic.read`, `system/Subscription.write`, and `system/Subscription.read`. The supplied onboarding states that the Event Subscription APIs are intended for 2-legged OAuth applications. Verify the token URL and granted scopes in the Developer Portal. Tokens stay server-side.

No FHIR payload is logged. Receipt metadata contains a hash of the resource reference, not its raw value. The private event table does contain the reference and must be access restricted, retained only as needed, and handled under applicable agreements. The public receipt route excludes resource references and patient identifiers.

## Production migration

Verify production approvals and permissions, migrate the queue worker, confirm signature keys and rotation, enforce replay windows and subscription allowlisting, add admin session authorization and CSRF controls, validate PHI handling and retention, run end-to-end Preview deliveries, then explicitly enable production. Current status is **CODE READY / CREDENTIALS REQUIRED**, with production disabled for writes.
