import { NextResponse } from "next/server";
import { createScannerCheckout, type ScannerPlan } from "@/lib/stripe-api";
import { scannerBillingEnabled, scannerTokenHash, validScannerToken } from "@/lib/scanner-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!scannerBillingEnabled()) return NextResponse.json({ error: "Scanner billing is not open" }, { status: 503 });
  try {
    const raw = await request.text();
    if (raw.length > 2048) return NextResponse.json({ error: "Invalid request" }, { status: 413 });
    const body = JSON.parse(raw);
    if (!validScannerToken(body.token) || !["pack10", "monthly"].includes(body.plan)) {
      return NextResponse.json({ error: "Invalid access key or plan" }, { status: 400 });
    }
    const origin = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
    const session = await createScannerCheckout(origin, body.plan as ScannerPlan, scannerTokenHash(body.token));
    if (!session.url) throw new Error("Missing checkout URL");
    return NextResponse.json({ url: session.url }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Scanner checkout failed", error);
    return NextResponse.json({ error: "Checkout is unavailable" }, { status: 503 });
  }
}
