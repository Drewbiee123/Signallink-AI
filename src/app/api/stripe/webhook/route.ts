import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { canonicalize } from "@/lib/canonicalize";
import { sha256hex } from "@/lib/hashing";
import { signString } from "@/lib/signing";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyStripeSignature, type StripeCheckoutSession } from "@/lib/stripe-api";

export const runtime = "nodejs";

const MAX_STRIPE_WEBHOOK_BYTES = 1024 * 1024;

interface StripeEvent {
  id: string;
  type: string;
  created?: number;
  data: { object: StripeCheckoutSession & { metadata?: Record<string, string>; status?: string; amount?: number; amount_refunded?: number } };
}

const SCANNER_PLANS: Record<string, { uses: number | null; amount: number }> = {
  "SL-SCAN-PACK10-499": { uses: 10, amount: 499 },
  "SL-SCAN-MONTHLY-999": { uses: null, amount: 999 }
};

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

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const tokenHash = subscription.metadata?.token_hash;
      if (tokenHash && subscription.metadata?.service_code === "SL-SCAN-MONTHLY-999") {
        const status = event.type === "customer.subscription.deleted" ? "inactive" : subscription.status === "active" ? "active" : "inactive";
        const { error } = await supabase.from("service_entitlements").update({ status }).eq("token_hash", tokenHash).eq("service_code", "SL-SCAN-MONTHLY-999");
        if (error) throw error;
      }
    }

    if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
      const charge = event.data.object;
      if (typeof charge.payment_intent === "string" &&
          (event.type === "charge.dispute.created" || charge.amount_refunded === charge.amount)) {
        const { data: order, error: orderError } = await supabase.from("revenue_orders")
          .select("stripe_session_id,service_code").eq("payment_intent_id", charge.payment_intent).maybeSingle();
        if (orderError) throw orderError;
        if (order && SCANNER_PLANS[order.service_code]) {
          const { error: revokeError } = await supabase.from("service_entitlements")
            .update({ status: "inactive" }).eq("stripe_session_id", order.stripe_session_id);
          if (revokeError) throw revokeError;
        }
      }
    }

    const relevant = new Set([
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.async_payment_failed"
    ]);

    if (relevant.has(event.type)) {
      const session = event.data.object;
      const paid = session.payment_status === "paid";
      const failed = event.type === "checkout.session.async_payment_failed";
      const processedAt = new Date().toISOString();

      const scannerPlan = SCANNER_PLANS[session.metadata?.service_code || ""];
      const tokenHash = session.metadata?.token_hash;
      if (paid && scannerPlan && tokenHash && /^[0-9a-f]{64}$/.test(tokenHash)) {
        if (session.currency !== "usd" || session.amount_total !== scannerPlan.amount ||
          scannerPlan.uses === null && !session.subscription) {
          throw new Error("Scanner checkout product or amount mismatch");
        }
        const { error: grantError } = await supabase.from("service_entitlements").insert({
          token_hash: tokenHash,
          service_code: session.metadata!.service_code,
          status: "active",
          max_uses: scannerPlan.uses,
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email || null,
          metadata: { origin: "SignalLink Protocol LLC", subscription_id: session.subscription || null, customer_id: session.customer || null }
        });
        if (grantError && grantError.code !== "23505") throw grantError;
        if (grantError?.code === "23505") {
          const { data: prior } = await supabase.from("service_entitlements").select("stripe_session_id").eq("token_hash", tokenHash).maybeSingle();
          if (prior?.stripe_session_id !== session.id) throw new Error("Access key already assigned to another order");
        }
      }

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
          stripe_event_id: event.id,
          stripe_signature_verified: true
        },
        updated_at: processedAt
      }, { onConflict: "stripe_session_id" });
      if (error) throw error;

      if (paid) {
        const receiptPayload = {
          schema: "signallink.payment-receipt.v1",
          stripe_event_id: event.id,
          stripe_event_type: event.type,
          stripe_session_id: session.id,
          payment_intent_id: session.payment_intent,
          service_code: session.metadata?.service_code || "unknown",
          amount_total: session.amount_total,
          currency: session.currency,
          payment_status: session.payment_status,
          processed_at: processedAt
        };
        const hash = sha256hex(canonicalize(receiptPayload));
        const timestamp = processedAt;
        const signatureValue = signString(`${hash}|${timestamp}`);
        const { error: anchorError } = await supabase.from("anchors").insert({
          anchor_id: `slk_pay_${crypto.randomUUID()}`,
          timestamp,
          hash_algorithm: "SHA-256",
          hash,
          signature: signatureValue,
          signer: process.env.SIGNALINK_SIGNER || "SignalLink Protocol LLC / SignalLink AI",
          metadata: {
            framework: "ADA-4WM",
            provenance_layer: 33,
            evidence_scope: "stripe_payment_event",
            stripe_event_id: event.id,
            stripe_session_id: session.id,
            stripe_signature_verified: true,
            external_attestation_claimed: false
          }
        });
        if (anchorError) throw anchorError;
      }
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
