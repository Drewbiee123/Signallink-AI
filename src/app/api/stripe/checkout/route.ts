import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_EVIDENCE_ANALYSIS;

  if (!secretKey || !price) {
    return NextResponse.json(
      { error: "Stripe checkout is not configured on the server." },
      { status: 503 }
    );
  }

  const requestUrl = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("line_items[0][price]", price);
  form.set("line_items[0][quantity]", "1");
  form.set("customer_creation", "always");
  form.set("billing_address_collection", "auto");
  form.set("success_url", `${origin}/api/stripe/confirm?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${origin}/?payment=cancelled`);
  form.set("metadata[service_code]", "SL-EVIDENCE-49");
  form.set("metadata[origin]", "SignalLink Protocol LLC");

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
    cache: "no-store",
  });

  const session = await stripeResponse.json();
  if (!stripeResponse.ok || !session?.url) {
    return NextResponse.json(
      { error: session?.error?.message || "Unable to start Stripe Checkout." },
      { status: stripeResponse.status || 502 }
    );
  }

  return NextResponse.json({ url: session.url });
}
