import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { canonicalize } from "@/lib/provenance/canonicalize";
import { sha256 } from "@/lib/provenance/hash";
export async function GET(_req: Request, { params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(receiptId)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const { data } = await db.from("athena_provenance_receipts").select("receipt_json,receipt_sha256").eq("id", receiptId).single();
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  const r = data.receipt_json;
  return NextResponse.json({ verified: sha256(canonicalize(r)) === data.receipt_sha256, source: "athenahealth", received_at_utc: r.received_at_utc,
    resource_type: r.fhir_resource_type, receipt_sha256: data.receipt_sha256,
    signature_verified: r.signature_verified, processing_status: r.processing_status });
}
