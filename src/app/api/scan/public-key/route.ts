import { NextResponse } from "next/server";
import { publicKeyPem } from "@/lib/signing";

export const runtime = "nodejs";

export async function GET() {
  try {
    const publicKey = publicKeyPem();
    if (!publicKey) return NextResponse.json({ error: "Public verification key is not configured" }, { status: 503 });
    return new Response(publicKey, { headers: { "content-type": "application/x-pem-file", "cache-control": "no-store", "content-disposition": "attachment; filename=signallink-public-key.pem" } });
  } catch {
    return NextResponse.json({ error: "Public verification key is unavailable" }, { status: 503 });
  }
}
