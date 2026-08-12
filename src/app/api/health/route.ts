import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const paymentsConfigured = Boolean(
    (process.env.STRIPE_RESTRICTED_KEY || process.env.STRIPE_SECRET_KEY) &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRICE_EVIDENCE_ANALYSIS
  );
  if (!supabase) {
    return NextResponse.json({ status: "degraded", database: "not_configured", payments: paymentsConfigured ? "configured" : "not_configured" }, { status: 503 });
  }

  const checks = await Promise.all([
    supabase.from("anchors").select("anchor_id", { head: true, count: "exact" }),
    supabase.from("revenue_leads").select("id", { head: true, count: "exact" }),
    supabase.from("revenue_orders").select("stripe_session_id", { head: true, count: "exact" })
  ]);
  const databaseReady = checks.every((check) => !check.error);
  const ready = databaseReady && paymentsConfigured;

  return NextResponse.json({
    status: ready ? "ok" : "degraded",
    database: databaseReady ? "connected" : "error",
    payments: paymentsConfigured ? "configured" : "not_configured"
  }, { status: ready ? 200 : 503 });
}
