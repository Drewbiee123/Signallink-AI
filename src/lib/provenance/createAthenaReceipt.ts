import { canonicalize } from "./canonicalize";
import { sha256 } from "./hash";
import type { AthenaEvent } from "@/lib/athena/parseNotificationBundle";
export function createAthenaReceipt(event: AthenaEvent, raw: Uint8Array, receivedAt: string) {
  const canonicalEventSha256 = sha256(canonicalize(event));
  const receipt = {
    schema: "signallink-athena-event-v1", source: "athenahealth",
    environment: process.env.ATHENA_ENV === "production" ? "production" : "preview",
    received_at_utc: new Date(receivedAt).toISOString(),
    event_id: event.eventId, subscription_id: event.subscriptionId,
    subscription_topic: event.topic, fhir_resource_type: event.resourceType,
    // References can contain patient identifiers; store only a digest.
    resource_reference_sha256: event.resourceReference ? sha256(event.resourceReference) : null,
    request_body_sha256: sha256(raw), canonical_event_sha256: canonicalEventSha256,
    signature_verified: true, processing_status: "accepted", provenance_version: "1.0"
  };
  return { receipt, receiptSha256: sha256(canonicalize(receipt)), canonicalEventSha256 };
}
