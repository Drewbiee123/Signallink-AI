import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyStripeSignature, type StripeCheckoutSession } from "@/lib/stripe-api";

export const runtime = "nodejs";

const MAX_STRIPE_WEBHOOK_BYTES = 1024 * 1024;

interface StripeEvent {
  id: string;
  type: string;
  data: { object: StripeCheckoutSession };
}

export async function POST(request: Request) {
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_STRIPE_WEBHOOK_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const payload = await request.text();
    if (Buffer.byteLength(payload, "utf8") > MAX_STRIPE_WEBHOOK_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const signature = request.headers.get("stripe-signature") || "";
    const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!secret || !verifyStripeSignature(payload, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(payload) as StripeEvent;
    if (!event?.id || !event?.type || !event?.data?.object) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "Persistence unavailable" }, { status: 503 });

    const { data: existing } = await supabase
      .from("stripe_webhook_events")
      .select("event_id")
      .eq("event_id", event.id)
      .maybeSingle();
    if (existing) return NextResponse.json({ received: true, duplicate: true });

    const relevant = new Set([
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.async_payment_failed"
    ]);
    if (relevant.has(event.type)) {
      const session = event.data.object;
      const paid = session.payment_status === "paid";
      const failed = event.type === "checkout.session.async_payment_failed";
      const { error } = await supabase.from("revenue_orders").upsert({
        stripe_session_id: session.id,
        payment_intent_id: session.payment_intent,
        service_code: session.metadata?.service_code || "unknown",
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_details?.email || null,
        payment_status: failed ? "failed" : session.payment_status,
        fulfillment_status: paid ? "ready" : failed ? "failed" : "pending",
        metadata: {
          framework: "ADA-4WM",
          provenance_layer: 33,
          stripe_event_id: event.id
        },
        updated_at: new Date().toISOString()
      }, { onConflict: "stripe_session_id" });
      if (error) throw error;
    }

    const { error: eventError } = await supabase.from("stripe_webhook_events").insert({
      event_id: event.id,
      event_type: event.type
    });
    if (eventError?.code !== "23505" && eventError) throw eventError;

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
