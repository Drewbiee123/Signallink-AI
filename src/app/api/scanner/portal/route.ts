import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { scannerTokenHash, validScannerToken } from "@/lib/scanner-access";
import { createBillingPortal } from "@/lib/stripe-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!validScannerToken(token)) return NextResponse.json({ error: "Access key required" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  const { data, error } = await supabase.from("service_entitlements").select("service_code,metadata")
    .eq("token_hash", scannerTokenHash(token)).maybeSingle();
  if (error || data?.service_code !== "SL-SCAN-MONTHLY-999" || typeof data.metadata?.customer_id !== "string") {
    return NextResponse.json({ error: "No monthly subscription found for this key" }, { status: 404 });
  }
  try {
    const origin = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
    const session = await createBillingPortal(data.metadata.customer_id, origin);
    return NextResponse.json({ url: session.url });
  } catch (cause) {
    console.error("Billing portal unavailable", cause);
    return NextResponse.json({ error: "Billing portal unavailable" }, { status: 503 });
  }
}
