import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Provenance Services and Payments",
  description: "Purchase evidence analysis or request an ADA-4WM pilot, monitoring engagement, government PO, or ACH invoice."
};

const offers = [
  {
    code: "SL-PILOT",
    name: "Provenance Pilot",
    description: "A scoped technical pilot for runtime evidence, drift capture, audit trails, or interoperability proof.",
    action: "Request pilot scope"
  },
  {
    code: "SL-MONITORING",
    name: "Operational Monitoring",
    description: "Request recurring post-deployment provenance, anomaly monitoring, and evidence reporting.",
    action: "Request monitoring plan"
  },
  {
    code: "SL-GOV-PO",
    name: "Government and Enterprise",
    description: "PO, invoice, ACH/EFT, and procurement-compatible engagement routing for qualified organizations.",
    action: "Request invoice or PO route"
  }
];

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string; checkout?: string }> }) {
  const query = await searchParams;
  return (
    <main>
      <p className="eyebrow">SIGNALLINK REVENUE GATEWAY</p>
      <h1>Buy evidence. Commission verification.</h1>
      <p className="lead">Every channel routes to SignalLink Protocol LLC and preserves the service code needed for payment and provenance reconciliation.</p>

      {query.submitted ? <div className="notice" role="status">Request received. SignalLink will review the scope and respond through the email provided.</div> : null}
      {query.error ? <div className="pending" role="alert">The request could not be recorded. Check the fields and try again.</div> : null}
      {query.checkout === "cancelled" ? <div className="pending" role="status">Checkout was canceled. No charge was completed.</div> : null}

      <article className="offer featured">
        <p className="offer-code">SL-EVIDENCE-49</p>
        <h2>SignalLink Evidence Analysis</h2>
        <p>One professional evidence-analysis session with structured findings and a SignalLink provenance receipt.</p>
        <p className="price">$49 USD</p>
        <form action="/api/checkout" method="post">
          <input type="hidden" name="service_code" value="SL-EVIDENCE-49" />
          <button type="submit">Buy securely with Stripe</button>
        </form>
      </article>

      <div className="offer-grid">
        {offers.map((offer) => (
          <article className="offer" key={offer.code}>
            <p className="offer-code">{offer.code}</p>
            <h2>{offer.name}</h2>
            <p>{offer.description}</p>
            <form action="/api/leads" method="post" className="lead-form">
              <input type="hidden" name="service_code" value={offer.code} />
              <label>Name<input name="name" required maxLength={120} autoComplete="name" /></label>
              <label>Work email<input name="email" type="email" required maxLength={320} autoComplete="email" /></label>
              <label>Organization<input name="organization" maxLength={200} autoComplete="organization" /></label>
              <label>What needs to be verified?<textarea name="message" maxLength={5000} rows={4} /></label>
              <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
              <button type="submit">{offer.action}</button>
            </form>
          </article>
        ))}
      </div>

      <p className="payment-note">Commercial web payments use Stripe-hosted Checkout. Federal contract payments continue through the agency-authorized invoice and SAM/EFT process rather than consumer checkout.</p>
    </main>
  );
}
