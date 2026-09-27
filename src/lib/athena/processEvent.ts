import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { athenaRequest } from "./client";
import { detectTransportAnomalies } from "./anomalyDetection";
import type { AthenaEvent } from "./parseNotificationBundle";
// Invoke only from an authenticated durable queue consumer.
export async function processAthenaEvent(id: string, event: AthenaEvent) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("STORAGE_NOT_CONFIGURED");
  const anomalies = detectTransportAnomalies(event);
  // Resource retrieval requires explicit scope and authorization configuration.
  if (process.env.ATHENA_ALLOW_RESOURCE_FETCH === "true" && event.resourceReference &&
      /^\/?(?:SubscriptionTopic|Subscription)\/[A-Za-z0-9._-]+$/.test(event.resourceReference)) {
    await athenaRequest(event.resourceReference);
  }
  for (const anomaly of anomalies) {
    const { error } = await db.from("athena_anomalies").insert({
      event_id: id, anomaly_type: anomaly, severity: "warning"
    });
    if (error) throw new Error("ANOMALY_STORAGE_FAILED");
  }
  const { error } = await db.from("athena_events").update({ processing_status: "complete" }).eq("id", id);
  if (error) throw new Error("EVENT_UPDATE_FAILED");
}
