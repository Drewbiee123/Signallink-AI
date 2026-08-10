import { createHmac } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function GET(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const appSecret = process.env.SIGNALLINK_APP_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const sessionId = new URL(request.url).searchParams.get("session_id");

  if (!secretKey || !appSecret || !sessionId) {
    return NextResponse.redirect(`${appUrl}/?payment=error`);
  }

  const stripeResponse = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    }
  );
  const session = await stripeResponse.json();

  const valid =
    stripeResponse.ok &&
    session?.payment_status === "paid" &&
    session?.amount_total === 4900 &&
    session?.currency === "usd" &&
    session?.metadata?.service_code === "SL-EVIDENCE-49";

  if (!valid) {
    return NextResponse.redirect(`${appUrl}/?payment=unverified`);
  }

  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const payload = Buffer.from(
    JSON.stringify({ session_id: sessionId, exp: expires, service: "SL-EVIDENCE-49" })
  ).toString("base64url");
  const token = `${payload}.${sign(payload, appSecret)}`;
  const response = NextResponse.redirect(`${appUrl}/?payment=success`);

  response.cookies.set("slk_paid_analysis", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
}
