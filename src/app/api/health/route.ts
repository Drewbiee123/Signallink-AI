import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const signingConfigured = Boolean(process.env.SIGNALINK_PRIVATE_KEY || process.env.SIGNALINK_HMAC_KEY);
  const paymentsConfigured = Boolean(
    (process.env.STRIPE_RESTRICTED_KEY || process.env.STRIPE_SECRET_KEY) &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRICE_EVIDENCE_ANALYSIS
  );

  if (!supabase) {
    return NextResponse.json({
      status: "degraded",
      protocol: signingConfigured ? "signing_configured" : "signing_not_configured",
      database: "not_configured",
      payments: paymentsConfigured ? "configured" : "not_configured"
    }, { status: 503 });
  }

  const checks = await Promise.all([
    supabase.from("anchors").select("anchor_id", { head: true, count: "exact" }),
    supabase.from("revenue_leads").select("id", { head: true, count: "exact" }),
    supabase.from("revenue_orders").select("stripe_session_id", { head: true, count: "exact" })
  ]);
  const databaseReady = checks.every((check) => !check.error);
  const protocolReady = databaseReady && signingConfigured;

  return NextResponse.json({
    status: protocolReady ? "ok" : "degraded",
    protocol: signingConfigured ? "signing_configured" : "signing_not_configured",
    database: databaseReady ? "connected" : "error",
    payments: paymentsConfigured ? "configured" : "not_configured"
  }, { status: protocolReady ? 200 : 503 });
}
