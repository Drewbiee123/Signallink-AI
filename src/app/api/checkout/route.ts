import { NextResponse } from "next/server";
import { createEvidenceCheckout } from "@/lib/stripe-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let serviceCode = "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      serviceCode = body?.service_code || "";
    } else {
      const form = await request.formData();
      serviceCode = String(form.get("service_code") || "");
    }
    if (serviceCode !== "SL-EVIDENCE-49") {
      return NextResponse.json({ error: "Unsupported service" }, { status: 400 });
    }

    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL;
    const requestOrigin = new URL(request.url).origin;
    const origin = (configuredOrigin || requestOrigin).replace(/\/$/, "");
    const session = await createEvidenceCheckout(origin);
    if (!session.url) throw new Error("Stripe did not return a hosted checkout URL");

    if (contentType.includes("application/json")) {
      return NextResponse.json({ checkout_url: session.url, session_id: session.id });
    }
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Checkout creation failed", error);
    return NextResponse.json({ error: "Checkout is temporarily unavailable" }, { status: 503 });
  }
}
