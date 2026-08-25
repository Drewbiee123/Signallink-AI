import { NextResponse } from "next/server";
import { createEvidenceCheckout } from "@/lib/stripe-api";

export const runtime = "nodejs";

const MAX_CHECKOUT_BODY_BYTES = 64 * 1024;

async function readCheckoutServiceCode(request: Request): Promise<string> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_CHECKOUT_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");

  const contentType = request.headers.get("content-type") || "";
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_CHECKOUT_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");

  if (contentType.includes("application/json")) {
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new Error("INVALID_JSON");
    }
    if (!body || typeof body !== "object") return "";
    return String((body as Record<string, unknown>).service_code || "");
  }

  if (contentType.includes("application/x-www-form-urlencoded") || !contentType) {
    return new URLSearchParams(raw).get("service_code") || "";
  }

  throw new Error("UNSUPPORTED_CONTENT_TYPE");
}

export async function POST(request: Request) {
  try {
    const serviceCode = await readCheckoutServiceCode(request);
    if (serviceCode !== "SL-EVIDENCE-49") {
      return NextResponse.json({ error: "Unsupported service" }, { status: 400 });
    }

    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL;
    const requestOrigin = new URL(request.url).origin;
    const origin = (configuredOrigin || requestOrigin).replace(/\/$/, "");
    const session = await createEvidenceCheckout(origin);
    if (!session.url) throw new Error("Stripe did not return a hosted checkout URL");

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return NextResponse.json({ checkout_url: session.url, session_id: session.id });
    }
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }
    if (error instanceof Error && error.message === "INVALID_JSON") {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "UNSUPPORTED_CONTENT_TYPE") {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }
    console.error("Checkout creation failed", error);
    return NextResponse.json({ error: "Checkout is temporarily unavailable" }, { status: 503 });
  }
}
