import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { scannerTokenHash, validScannerToken } from "@/lib/scanner-access";
import { cancelSubscriptionRenewal } from "@/lib/stripe-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!validScannerToken(token)) return NextResponse.json({ error: "Access key required" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Subscription service unavailable" }, { status: 503 });
  const { data, error } = await supabase.from("service_entitlements").select("service_code,metadata")
    .eq("token_hash", scannerTokenHash(token)).maybeSingle();
  if (error || data?.service_code !== "SL-SCAN-MONTHLY-999" || typeof data.metadata?.subscription_id !== "string") {
    return NextResponse.json({ error: "No subscription found for this access key" }, { status: 404 });
  }
  try {
    const subscription = await cancelSubscriptionRenewal(data.metadata.subscription_id);
    return NextResponse.json({ renewal_cancelled: subscription.cancel_at_period_end }, { headers: { "cache-control": "no-store" } });
  } catch (cause) {
    console.error("Subscription cancellation failed", cause);
    return NextResponse.json({ error: "Cancellation is unavailable. Please contact support." }, { status: 503 });
  }
}
