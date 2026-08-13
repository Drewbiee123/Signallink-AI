import crypto from "node:crypto";

const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_VERSION = "2026-06-24.dahlia";

function stripeKey() {
  const key = process.env.STRIPE_RESTRICTED_KEY || process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe server key is not configured");
  return key;
}

async function stripeRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${stripeKey()}`,
      "stripe-version": STRIPE_VERSION,
      ...(init.headers || {})
    },
    cache: "no-store"
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Stripe request failed: ${body?.error?.message || response.status}`);
  return body as T;
}

function integrationIdentifier() {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const bytes = crypto.randomBytes(8);
  let suffix = "";
  for (const byte of bytes) suffix += letters[byte % letters.length];
  return `signallink_web_${suffix}`;
}

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
  status: string | null;
  payment_status: string;
  payment_intent: string | null;
  amount_total: number | null;
  currency: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string>;
}

export async function createEvidenceCheckout(origin: string) {
  const price = process.env.STRIPE_PRICE_EVIDENCE_ANALYSIS || "price_1U2hiNRoFxjovMy9bTusFnIo";
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    customer_creation: "always",
    allow_promotion_codes: "true",
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/services?checkout=cancelled`,
    integration_identifier: integrationIdentifier(),
    "metadata[service_code]": "SL-EVIDENCE-49",
    "metadata[origin]": "SignalLink Protocol LLC",
    "metadata[framework]": "ADA-4WM",
    "metadata[provenance_layer]": "33"
  });
  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
}

export async function retrieveCheckoutSession(id: string) {
  if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(id)) throw new Error("Invalid Checkout Session ID");
  return stripeRequest<StripeCheckoutSession>(`/checkout/sessions/${encodeURIComponent(id)}`);
}

export function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return signatures.some((signature) => {
    if (signature.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  });
}
