import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyStripeSignature, type StripeCheckoutSession } from "@/lib/stripe-api";

export const runtime = "nodejs";

interface StripeEvent {
  id: string;
  type: string;
  data: { object: StripeCheckoutSession };
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!secret || !verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Persistence unavailable" }, { status: 503 });

  const { error: eventError } = await supabase.from("stripe_webhook_events").insert({
    event_id: event.id,
    event_type: event.type
  });
  if (eventError?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
  if (eventError) throw eventError;

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const paid = session.payment_status === "paid";
    const { error } = await supabase.from("revenue_orders").upsert({
      stripe_session_id: session.id,
      payment_intent_id: session.payment_intent,
      service_code: session.metadata?.service_code || "unknown",
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email || null,
      payment_status: session.payment_status,
      fulfillment_status: paid ? "ready" : "pending",
      metadata: {
        framework: "ADA-4WM",
        provenance_layer: 33,
        stripe_event_id: event.id
      },
      updated_at: new Date().toISOString()
    }, { onConflict: "stripe_session_id" });
    if (error) throw error;
  }

  return NextResponse.json({ received: true });
}
