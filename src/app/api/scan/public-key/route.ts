import crypto from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const source = process.env.SIGNALINK_PUBLIC_KEY || process.env.SIGNALINK_PRIVATE_KEY;
    if (!source) return NextResponse.json({ error: "Public verification key is not configured" }, { status: 503 });
    const pem = source.replace(/\\n/g, "\n");
    const publicKey = crypto.createPublicKey(pem).export({ type: "spki", format: "pem" }).toString();
    return new Response(publicKey, { headers: { "content-type": "application/x-pem-file", "cache-control": "no-store", "content-disposition": "attachment; filename=signallink-public-key.pem" } });
  } catch {
    return NextResponse.json({ error: "Public verification key is unavailable" }, { status: 503 });
  }
}
