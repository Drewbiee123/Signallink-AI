import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Federal Mission Assurance Gateway | SignalLink Protocol LLC",
  description: "Mission-relevant federal-source analysis with deterministic provenance receipts and explicit evidence boundaries."
};

export default function FederalMissionPage() {
  return (
    <main>
      <p className="eyebrow">SIGNALLINK FEDERAL MISSION ASSURANCE</p>
      <h1>Federal-source evidence in. Mission-relevant action out.</h1>
      <p className="lead">
        This gateway connects authorized public federal data sources to SignalLink provenance, mission-relevance analysis, and action-oriented evidence receipts.
      </p>

      <section>
        <div><span>Mission Lane</span><strong>NIST NVD → RAPTOR assessment</strong></div>
        <div><span>Capture Lane</span><strong>SAM.gov → opportunity evidence</strong></div>
        <div><span>Federal Vendor</span><strong>CAGE 16WJ1</strong></div>
      </section>

      <article className="offer featured">
        <p className="offer-code">MISSION-CRITICAL</p>
        <h2>NIST NVD Vulnerability Assessment</h2>
        <p>Enter a CVE identifier. SignalLink retrieves the NVD record, computes a transparent mission-relevance score, creates deterministic source and assessment hashes, and signs the assessment when a server signing key is configured.</p>
        <form action="/api/federal/nvd" method="get" className="lead-form">
          <label>CVE ID<input name="cve" defaultValue="CVE-2021-44228" required maxLength={32} /></label>
          <button type="submit">Run federal mission assessment</button>
        </form>
      </article>

      <article className="offer">
        <p className="offer-code">FEDERAL-CAPTURE</p>
        <h2>SAM.gov Contract Opportunity Feed</h2>
        <p>The server-side gateway is ready for a SAM.gov public API key. It normalizes opportunity identifiers, solicitation numbers, NAICS, deadlines, and traceable SHA-256 source records without exposing the API key to the browser.</p>
        <p><code>/api/federal/sam?postedFrom=08/01/2026&amp;postedTo=08/25/2026&amp;title=artificial%20intelligence</code></p>
      </article>

      <div className="notice">
        <strong>Evidence boundary</strong>
        <p>NIST NVD and SAM.gov remain the authoritative sources for their underlying records. SignalLink supplies its own analysis, normalization, cryptographic correlation, and recommended action. Nothing on this page represents NIST, CISA, SAM.gov, GSA, DoD, or other government endorsement, certification, award, or agency risk determination.</p>
      </div>
    </main>
  );
}
