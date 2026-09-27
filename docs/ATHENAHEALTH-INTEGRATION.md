# Athenahealth Event Gateway (Preview)

Endpoint: https://aiprov.org/api/athena/webhook

Preview FHIR base: https://api.preview.platform.athenahealth.com/fhir/r4
Production FHIR base: https://api.platform.athenahealth.com/fhir/r4

This is an incomplete, fail-closed integration. The signature adapter verifies `X-Hub-Signature: sha256=<hex HMAC>` against the exact body bytes using the shared `X-Hub-Secret` supplied when creating a Subscription. It rejects requests when `ATHENA_WEBHOOK_SIGNING_SECRET` is unset. The queue requires an external durable HTTPS receiver; the repository does not yet provide a consumer. No production approval or athenahealth credentials are present. Do not configure a live subscription yet.

## Setup

1. Apply `migrations/20260927_athena.sql` to the configured Supabase database.
2. Set `ATHENA_ENV=preview`, `ATHENA_CLIENT_ID`, `ATHENA_CLIENT_SECRET`, `ATHENA_TOKEN_URL`, `ATHENA_ADMIN_TOKEN`, `ATHENA_QUEUE_ENDPOINT`, and `ATHENA_QUEUE_TOKEN` on the server. Existing Supabase service credentials are also required.
3. Use a new random shared secret as `ATHENA_WEBHOOK_SIGNING_SECRET`; the same secret is passed as `X-Hub-Secret` at Subscription creation. The verifier follows athenahealth's documented `X-Hub-Signature` HMAC-SHA256 format. Confirm key rotation and replay rules for your application.
4. Connect an authenticated durable worker to process event IDs and implement retry/dead-letter handling. Confirm the queue API and its durability guarantee. Do not send PHI to an unreviewed queue.
5. Use the protected `/api/athena/topics` endpoint to discover actual topics, then create a standards-compliant Subscription after validating athenahealth-specific constraints.

Preview token URL: `https://api.preview.platform.athenahealth.com/oauth2/v1/token`. The OAuth client submits a Basic client ID/secret and a space-delimited `scope` parameter for `system/SubscriptionTopic.read system/Subscription.write system/Subscription.read`. The supplied onboarding states that Event Subscription APIs are intended for 2-legged OAuth applications. Verify granted scopes in the Developer Portal. Tokens stay server-side.

The published Subscription API requires a `criteria` topic URL and `ah-practice` filter. Supported channel is `rest-hook`, payload content is `id-only`; one subscription covers one topic. Its `eventNumber` resets within each notification Bundle; deduplication should use the notification event's `id`. The current parser processes only the first event in a potentially batched Bundle and must be extended before deployment.

No FHIR payload is logged. Receipt metadata contains a hash of the resource reference, not its raw value. The private event table does contain the reference and must be access restricted, retained only as needed, and handled under applicable agreements. The public receipt route excludes resource references and patient identifiers.

## Production migration

Verify production approvals and permissions, migrate the queue worker, enforce replay windows and subscription allowlisting, handle every event in a batched Bundle, add admin session authorization and CSRF controls, validate PHI handling and retention, run end-to-end Preview deliveries, then explicitly enable production. Current status is **CODE READY / CREDENTIALS REQUIRED**, with production disabled for writes.

Sources: https://docs.athenahealth.com/api/guides/event-notifications-onboarding ; https://docs.athenahealth.com/api/guides/event-notifications-best-practices ; https://docs.athenahealth.com/api/api-ref/fhir-subscription ; https://docs.athenahealth.com/api/guides/token-endpoint ; https://github.com/athenahealth/aone-fhir-subscriptions
