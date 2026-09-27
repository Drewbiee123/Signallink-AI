import { NextResponse } from "next/server";
import { isAthenaAdmin } from "@/lib/athena/admin";
import { athenaRequest } from "@/lib/athena/client";
export async function GET(req: Request) {
  if (!isAthenaAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try { return NextResponse.json(await athenaRequest("Subscription")); }
  catch { return NextResponse.json({ error: "subscription lookup unavailable" }, { status: 502 }); }
}
export async function POST(req: Request) {
  if (!isAthenaAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (process.env.ATHENA_ENV === "production") return NextResponse.json({ error: "production disabled" }, { status: 403 });
  // No subscription can be created until the callback can authenticate deliveries.
  const { signatureReady } = await import("@/lib/athena/signature");
  if (!signatureReady()) return NextResponse.json({ error: "webhook verification not configured" }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  if (body?.resourceType !== "Subscription" || typeof body.topic !== "string" || !body.topic ||
      !body.channel || typeof body.channel !== "object") return NextResponse.json({ error: "invalid Subscription" }, { status: 400 });
  try { return NextResponse.json(await athenaRequest("Subscription", { method: "POST", body: JSON.stringify(body) }), { status: 201 }); }
  catch { return NextResponse.json({ error: "subscription creation failed" }, { status: 502 }); }
}
