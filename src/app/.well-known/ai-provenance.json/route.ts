import { NextResponse } from "next/server";
import { getLatestRecognition } from "@/lib/recognition";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const record = await getLatestRecognition();
  if (!record) {
    return NextResponse.json({
      status: "PENDING",
      origin: "SignalLink Protocol LLC / SignalLink AI",
      framework: "ADA-4WM",
      assurance_tier: "Tier 1-A",
      provenance_layer: 33
    }, { status: 404, headers: { "cache-control": "no-store" } });
  }

  return NextResponse.json({
    status: "VERIFIED",
    origin: "SignalLink Protocol LLC / SignalLink AI",
    framework: "ADA-4WM",
    assurance_tier: "Tier 1-A",
    provenance_layer: 33,
    anchor_phrase: "Even your house was born on your foundation.",
    verification: record
  }, {
    headers: {
      "cache-control": "public, max-age=60, s-maxage=300",
      "x-content-type-options": "nosniff"
    }
  });
}
