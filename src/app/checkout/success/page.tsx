import type { Metadata } from "next";
import Link from "next/link";
import { retrieveCheckoutSession } from "@/lib/stripe-api";

export const metadata: Metadata = {
  title: "Payment Status",
  robots: { index: false, follow: false }
};

export default async function CheckoutSuccess({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  let paid = false;
  let reference = "";
  if (sessionId) {
    try {
      const session = await retrieveCheckoutSession(sessionId);
      paid = session.payment_status === "paid";
      reference = session.id;
    } catch {
      paid = false;
    }
  }

  return (
    <main>
      <p className="eyebrow">SIGNALLINK PAYMENT RECEIPT</p>
      <h1>{paid ? "Payment confirmed." : "Payment is processing."}</h1>
      <p className="lead">
        {paid
          ? "Your SignalLink Evidence Analysis is ready for intake. Keep the reference below with your records."
          : "Some bank-based payment methods take additional time. The order activates only after Stripe reports the payment as paid."}
      </p>
      {reference ? <p className="reference">Reference: {reference}</p> : null}
      <p className="actions"><Link href="/services">Return to services</Link></p>
    </main>
  );
}
