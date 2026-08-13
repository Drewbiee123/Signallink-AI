import Link from "next/link";

export default function Home() {
  return (
    <main>
      <p className="eyebrow">SIGNALLINK PROTOCOL LLC</p>
      <h1>Verifiable AI evidence, anchored at creation.</h1>
      <p className="lead">The Genesis verification gateway creates canonical SHA-256 receipts with timestamped cryptographic signatures and durable audit storage.</p>
      <section>
        <div><span>Framework</span><strong>ADA-4WM</strong></div>
        <div><span>Provenance</span><strong>Layer 33</strong></div>
        <div><span>Vendor</span><strong>CAGE 16WJ1</strong></div>
      </section>
      <div className="actions action-row">
        <Link href="/services">Purchase or commission SignalLink</Link>
        <Link href="/recognition" className="secondary-action">View verified production evidence</Link>
      </div>
      <p className="quote">“Even your house was born on your foundation.”</p>
    </main>
  );
}
