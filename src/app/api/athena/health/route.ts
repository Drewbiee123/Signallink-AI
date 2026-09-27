import { NextResponse } from "next/server";
import { signatureReady } from "@/lib/athena/signature";
export function GET() {
  const oauth = !!(process.env.ATHENA_CLIENT_ID && process.env.ATHENA_CLIENT_SECRET);
  const signature = signatureReady();
  return NextResponse.json({
    service: "SignalLink Athena Event Gateway", status: "ok",
    environment: process.env.ATHENA_ENV === "production" ? "production" : "preview",
    webhook_ready: signature && !!(process.env.ATHENA_QUEUE_ENDPOINT && process.env.SUPABASE_SERVICE_ROLE_KEY),
    oauth_configured: oauth, signature_verification_configured: signature,
    timestamp: new Date().toISOString()
  });
}
