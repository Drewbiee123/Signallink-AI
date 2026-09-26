import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { scannerTokenHash, validScannerToken } from "@/lib/scanner-access";
import { retrieveSubscription } from "@/lib/stripe-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Scanner access is unavailable" }, { status: 503 });
  let body: { action?: string; token?: string };
  try {
    const raw = await request.text();
    if (raw.length > 1024) return NextResponse.json({ error: "Request too large" }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.action === "free") {
    const secret = process.env.SIGNALINK_FREE_QUOTA_KEY;
    const ip = request.headers.get("x-vercel-forwarded-for");
    if (!secret || !ip || process.env.VERCEL !== "1") return NextResponse.json({ error: "Free scans are unavailable" }, { status: 503 });
    const ipDigest = crypto.createHmac("sha256", secret).update(ip).digest("hex");
    const token = crypto.randomBytes(32).toString("hex");
    const { data, error } = await supabase.rpc("claim_scanner_free", { p_token_hash: scannerTokenHash(token), p_ip_digest: ipDigest });
    if (error) {
      console.error("Free access failed", error);
      return NextResponse.json({ error: "Free access is unavailable" }, { status: 503 });
    }
    if (!data) return NextResponse.json({ error: "Three free scans have already been claimed on this connection" }, { status: 409 });
    return NextResponse.json({ token, remaining: 3, plan: "free" }, { headers: { "cache-control": "no-store" } });
  }

  if (body.action !== "status" || !validScannerToken(body.token)) return NextResponse.json({ error: "Invalid access key" }, { status: 400 });
  const { data, error } = await supabase.from("service_entitlements")
    .select("status,uses,max_uses,service_code,metadata")
    .eq("token_hash", scannerTokenHash(body.token)).maybeSingle();
  if (error) return NextResponse.json({ error: "Access check unavailable" }, { status: 503 });
  if (!data) return NextResponse.json({ status: "pending", remaining: null }, { headers: { "cache-control": "no-store" } });
  let active = data.status === "active";
  if (data.service_code === "SL-SCAN-MONTHLY-999") {
    const subscriptionId = data.metadata?.subscription_id;
    try {
      active = active && typeof subscriptionId === "string" && (await retrieveSubscription(subscriptionId)).status === "active";
    } catch {
      return NextResponse.json({ error: "Subscription status could not be confirmed" }, { status: 503 });
    }
  }
  return NextResponse.json({ status: active ? "active" : "inactive", plan: data.service_code, remaining: data.max_uses === null ? null : Math.max(0, data.max_uses - data.uses) }, { headers: { "cache-control": "no-store" } });
}
