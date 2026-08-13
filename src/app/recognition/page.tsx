import type { Metadata } from "next";
import Link from "next/link";
import { getLatestRecognition } from "@/lib/recognition";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verified ADA-4WM Production Evidence | SignalLink Protocol LLC",
  description: "Machine-verifiable production certification for SignalLink Protocol LLC's ADA-4WM Layer 33 provenance gateway.",
  alternates: { canonical: "/recognition" },
  openGraph: {
    title: "SignalLink ADA-4WM Production Evidence",
    description: "SHA-256 anchored, ledger-confirmed production evidence from SignalLink Protocol LLC.",
    type: "website"
  }
};

export default async function RecognitionPage() {
  const record = await getLatestRecognition();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "SignalLink ADA-4WM Production Certification",
    author: { "@type": "Organization", name: "SignalLink Protocol LLC" },
    about: ["AI provenance", "ADA-4WM", "SHA-256", "cryptographic audit trails"],
    dateModified: record?.timestamp,
    identifier: record?.anchor_id,
    isBasedOn: record ? "/.well-known/ai-provenance.json" : undefined
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <p className="eyebrow">SIGNALLINK RECOGNITION RELAY</p>
      <h1>Evidence that can introduce itself.</h1>
      <p className="lead">
        ADA-4WM production status is published from the same durable anchor ledger used by the verification gateway.
      </p>

      {record ? (
        <>
          <section aria-label="Latest verified production evidence">
            <div><span>Status</span><strong>Ledger confirmed</strong></div>
            <div><span>Framework</span><strong>ADA-4WM · Layer 33</strong></div>
            <div><span>Algorithm</span><strong>{record.hash_algorithm}</strong></div>
          </section>
          <dl className="evidence">
            <div><dt>Anchor ID</dt><dd>{record.anchor_id}</dd></div>
            <div><dt>Timestamp</dt><dd>{record.timestamp}</dd></div>
            <div><dt>Signer</dt><dd>{record.signer}</dd></div>
            <div><dt>SHA-256</dt><dd>{record.hash}</dd></div>
            <div><dt>Signature</dt><dd>{record.signature}</dd></div>
          </dl>
          <p className="actions">
            <Link href="/.well-known/ai-provenance.json">Open machine-readable proof</Link>
          </p>
        </>
      ) : (
        <div className="pending" role="status">
          No completed production certification is published yet. The relay will activate automatically after the first passing certification run.
        </div>
      )}

      <p className="quote">“Even your house was born on your foundation.”</p>
    </main>
  );
}
