import Link from "next/link";

export default function Home() {
  return (
    <main>
      <p className="eyebrow">SIGNALLINK PROTOCOL LLC</p>
      <h1>Anchor evidence. Verify it later. Detect tampering immediately.</h1>
      <p className="lead">The SignalLink Genesis Gateway canonicalizes JSON evidence, creates SHA-256 receipts, binds them to cryptographic signatures and timestamps, persists anchor records, and independently verifies integrity without requiring the original creator to be trusted.</p>
      <section>
        <div><span>Framework</span><strong>ADA-4WM</strong></div>
        <div><span>Provenance</span><strong>Layer 33</strong></div>
        <div><span>Federal Vendor</span><strong>CAGE 16WJ1</strong></div>
      </section>
      <div className="actions action-row">
        <Link href="/anchor">Create an anchor</Link>
        <Link href="/verify">Verify evidence</Link>
        <Link href="/challenge" className="secondary-action">Take reproducibility challenge</Link>
        <Link href="/federal" className="secondary-action">Federal mission gateway</Link>
        <Link href="/recognition" className="secondary-action">View published evidence</Link>
        <Link href="/services" className="secondary-action">Commercial services</Link>
      </div>
      <div className="notice">
        <strong>Open verification challenge</strong>
        <p>Independent developers and technical reviewers can reproduce SignalLink Public Reproducibility Challenge #1 without trusting the SignalLink server and publish PASS/FAIL results in the open GitHub review thread.</p>
      </div>
      <div className="notice">
        <strong>Validation boundary</strong>
        <p>SignalLink publishes reproducible implementation-level cryptographic and tamper tests. Those results are evidence of tested software behavior; they are not a claim of NIST, C2PA, Sigstore, government, or third-party certification unless such certification is separately obtained.</p>
      </div>
      <p className="quote">“Even your house was born on your foundation.”</p>
    </main>
  );
}
