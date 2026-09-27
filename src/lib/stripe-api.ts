import crypto from "node:crypto";

const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_VERSION = "2026-08-26.dahlia";

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
  customer?: string | null;
  subscription?: string | null;
  amount_total: number | null;
  currency: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string>;
}

export type ScannerPlan = "pack10" | "monthly";

export async function createScannerCheckout(origin: string, plan: ScannerPlan, tokenHash: string) {
  const subscription = plan === "monthly";
  const code = subscription ? "SL-SCAN-MONTHLY-999" : "SL-SCAN-PACK10-499";
  const body = new URLSearchParams({
    mode: subscription ? "subscription" : "payment",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": subscription ? "999" : "499",
    "line_items[0][price_data][product_data][name]": subscription ? "SignalLink Provenance Scans Monthly" : "SignalLink Provenance Scans: 10 Credits",
    "line_items[0][price_data][product_data][description]": "File hashing, C2PA validation, and downloadable signed evidence receipts. No AI-origin classifier is included.",
    "line_items[0][quantity]": "1",
    success_url: `${origin}/scanner?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/scanner?checkout=cancelled`,
    client_reference_id: integrationIdentifier(),
    integration_identifier: integrationIdentifier(),
    "metadata[service_code]": code,
    "metadata[token_hash]": tokenHash,
    "metadata[origin]": "SignalLink Protocol LLC"
  });
  if (subscription) {
    body.set("line_items[0][price_data][recurring][interval]", "month");
    body.set("subscription_data[metadata][service_code]", code);
    body.set("subscription_data[metadata][token_hash]", tokenHash);
  } else {
    body.set("customer_creation", "always");
  }
  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body
  });
}

export async function createEvidenceCheckout(origin: string) {
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "4900",
    "line_items[0][price_data][product_data][name]": "SignalLink Evidence Analysis",
    "line_items[0][price_data][product_data][description]": "One professional evidence-analysis session with structured findings and a SignalLink provenance receipt.",
    "line_items[0][quantity]": "1",
    customer_creation: "always",
    allow_promotion_codes: "true",
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/services?checkout=cancelled`,
    client_reference_id: integrationIdentifier(),
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

export async function retrieveSubscription(id: string): Promise<{ id: string; status: string }> {
  if (!/^sub_[A-Za-z0-9]+$/.test(id)) throw new Error("Invalid Subscription ID");
  return stripeRequest<{ id: string; status: string }>(`/subscriptions/${encodeURIComponent(id)}`);
}

export async function createBillingPortal(customerId: string, origin: string): Promise<{ url: string }> {
  if (!/^cus_[A-Za-z0-9]+$/.test(customerId)) throw new Error("Invalid customer ID");
  return stripeRequest<{ url: string }>("/billing_portal/sessions", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ customer: customerId, return_url: `${origin}/scanner` })
  });
}

export async function cancelSubscriptionRenewal(id: string): Promise<{ id: string; cancel_at_period_end: boolean }> {
  if (!/^sub_[A-Za-z0-9]+$/.test(id)) throw new Error("Invalid Subscription ID");
  return stripeRequest<{ id: string; cancel_at_period_end: boolean }>(`/subscriptions/${encodeURIComponent(id)}`, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ cancel_at_period_end: "true" })
  });
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
