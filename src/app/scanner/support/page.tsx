import Link from "next/link";

export default async function ScannerSupport({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const query = await searchParams;
  return <main>
    <p className="eyebrow">SIGNALLINK CUSTOMER SUPPORT</p>
    <h1>Help with your scans or purchase.</h1>
    <p className="lead">Use this form for an access key you lost, a payment question, a refund request, or a report you cannot verify. Include your Stripe receipt email and session reference if available. Never send payment card numbers or your private files in this form.</p>
    {query.submitted && <div className="success-box" role="status">Your request was recorded. Keep your Stripe receipt for reference.</div>}
    {query.error && <div className="error-box" role="alert">The request could not be recorded. Please check the fields and try again.</div>}
    <form action="/api/leads" method="post" className="lead-form">
      <input type="hidden" name="service_code" value="SL-SCAN-SUPPORT" />
      <label>Name<input name="name" required maxLength={120} autoComplete="name" /></label>
      <label>Receipt email<input name="email" type="email" required maxLength={320} autoComplete="email" /></label>
      <label>Order or receipt reference, if known<input name="organization" maxLength={200} /></label>
      <label>How can we help?<textarea name="message" required maxLength={5000} rows={5} /></label>
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button type="submit">Send support request</button>
    </form>
    <p className="actions"><Link href="/scanner">Return to scanner</Link></p>
  </main>;
}
