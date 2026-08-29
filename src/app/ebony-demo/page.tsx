import Link from "next/link";
import evidence from "../../../public/evidence/ebony-signallink-synthetic.json";

export const metadata = {
  title: "Project Ebony x SignalLink Synthetic Demonstration",
  description: "Public synthetic integration-readiness evidence for Project Ebony telemetry and SignalLink cryptographic provenance."
};

export default function EbonyDemoPage() {
  const checks = evidence.verification_summary;
  return (
    <main>
      <p className="eyebrow">PROJECT EBONY X SIGNALLINK</p>
      <h1>Synthetic telemetry, cryptographically signed and independently checkable.</h1>
      <p className="lead">This public readiness demonstration combines an Ebony-shaped RGB optical event and dielectric-permittivity sensor event with SignalLink SHA-256 hashing, Ed25519 signatures, and tamper rejection.</p>

      <section>
        <div><span>Synthetic events</span><strong>{evidence.event_count}</strong></div>
        <div><span>Signature verification</span><strong>{checks.all_signatures_valid ? "PASS" : "FAIL"}</strong></div>
        <div><span>Tamper rejection</span><strong>{checks.all_tamper_tests_rejected ? "PASS" : "FAIL"}</strong></div>
      </section>

      <dl className="evidence">
        <div><dt>Batch ID</dt><dd>{evidence.batch_id}</dd></div>
        <div><dt>Evidence SHA-256</dt><dd>{evidence.evidence_sha256}</dd></div>
        <div><dt>Signature algorithm</dt><dd>{evidence.signature_algorithm}</dd></div>
        <div><dt>Evidence mode</dt><dd>{evidence.mode}</dd></div>
      </dl>

      {evidence.results.map((result) => (
        <div className="notice" key={result.event.event_id}>
          <strong>{result.event.event_type}</strong>
          <p>Payload SHA-256: <span className="reference">{result.raw_payload_sha256}</span></p>
          <p>Ed25519 signature: {result.signature_valid ? "VALID" : "INVALID"} | Modified-event test: {result.tamper_test_rejected ? "REJECTED AS EXPECTED" : "FAILED"}</p>
        </div>
      ))}

      <div className="actions action-row">
        <a href="/evidence/ebony-signallink-synthetic.json">Download machine-readable evidence</a>
        <Link className="secondary-action" href="/verify">Open SignalLink verifier</Link>
      </div>

      <div className="pending">
        <strong>Evidence boundary</strong>
        <p>This proves the synthetic SignalLink-side integration path. It does not claim a completed live WebRTC connection, access to HVF private systems, Bitcoin publication, or HVF validation. The live handshake remains the next jointly authorized step.</p>
      </div>
      <p className="quote">“Even your house was born on your foundation.”</p>
    </main>
  );
}
