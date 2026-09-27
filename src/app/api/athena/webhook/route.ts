import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { parseNotificationBundle } from "@/lib/athena/parseNotificationBundle";
import { signatureReady, verifyAthenaSignature } from "@/lib/athena/signature";
import { createAthenaReceipt } from "@/lib/provenance/createAthenaReceipt";
import { enqueueAthenaEvent } from "@/lib/queue/eventQueue";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!signatureReady()) return NextResponse.json({ error: "signature verification not configured" }, { status: 503 });
  const type = request.headers.get("content-type") || "";
  if (!/^application\/(?:fhir\+json|json)(?:;|$)/i.test(type)) return NextResponse.json({ error: "unsupported content type" }, { status: 415 });
  if (Number(request.headers.get("content-length")) > 262144) return NextResponse.json({ error: "payload too large" }, { status: 413 });
  let raw: Uint8Array;
  try { raw = new Uint8Array(await request.arrayBuffer()); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }
  if (raw.length > 262144) return NextResponse.json({ error: "payload too large" }, { status: 413 });
  if (!(await verifyAthenaSignature(raw, request.headers))) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  let event;
  try { event = parseNotificationBundle(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw))); }
  catch { return NextResponse.json({ error: "malformed FHIR notification" }, { status: 400 }); }
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "storage unavailable" }, { status: 503 });
  const received = new Date().toISOString();
  const { receipt, receiptSha256, canonicalEventSha256 } = createAthenaReceipt(event, raw, received);
  const environment = receipt.environment;
  const { data: stored, error } = await db.from("athena_events").insert({
    external_event_id: event.eventId, bundle_id: event.bundleId,
    subscription_id: event.subscriptionId, subscription_topic: event.topic,
    resource_reference: event.resourceReference, resource_type: event.resourceType,
    received_at: received, signature_verified: true, request_body_sha256: receipt.request_body_sha256,
    canonical_event_sha256: canonicalEventSha256, processing_status: "accepted", environment
  }).select("id").single();
  if (error?.code === "23505") return NextResponse.json({ status: "duplicate" }, { status: 200 });
  if (error || !stored) return NextResponse.json({ error: "storage unavailable" }, { status: 503 });
  const { error: receiptError } = await db.from("athena_provenance_receipts").insert({
    event_id: stored.id, schema_version: receipt.schema, receipt_json: receipt, receipt_sha256: receiptSha256
  });
  if (receiptError) return NextResponse.json({ error: "receipt storage unavailable" }, { status: 503 });
  try { await enqueueAthenaEvent(stored.id); }
  catch { return NextResponse.json({ error: "queue unavailable; event stored for retry" }, { status: 503 }); }
  return NextResponse.json({ status: "accepted", receipt_sha256: receiptSha256 });
}
