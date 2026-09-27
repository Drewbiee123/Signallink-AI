import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Healthcare Event Provenance | SignalLink AI",
  description: "SignalLink Protocol LLC's proposed Preview integration for verifiable healthcare event delivery. Development status and contact information."
};

export default function AthenaIntegrationPage() {
  return (
    <main>
      <p className="eyebrow">SIGNALLINK PROTOCOL LLC · HEALTHCARE INTEGRATIONS</p>
      <h1>Verifiable records for healthcare events.</h1>
      <p className="lead">
        SignalLink AI is developing a server-to-server gateway for FHIR Event Notifications.
        Its intended workflow verifies each incoming message, records a timestamped SHA-256
        provenance receipt, and sends authorized follow-up work to a secure background process.
      </p>
      <div className="pending" role="status">
        <strong>Preview development · integration not live</strong>
        <p>Our athenahealth integration is in code review. We have not completed Preview delivery testing,
          received production approval, or connected this page to patient data. No health information
          should be entered on this page.</p>
      </div>
      <section aria-label="Integration principles">
        <div><span>Input</span><strong>FHIR notification metadata</strong><p>Messages are checked before acceptance.</p></div>
        <div><span>Evidence</span><strong>Deterministic receipts</strong><p>SHA-256 records can show whether recorded evidence changed.</p></div>
        <div><span>Privacy</span><strong>Limited public output</strong><p>Patient identifiers are excluded from public verification.</p></div>
      </section>
      <h2>Current development checkpoints</h2>
      <div className="evidence">
        <div><strong>Built for review</strong><p>Notification parsing, signature verification, OAuth client structure, and receipt creation.</p></div>
        <div><strong>Still required</strong><p>Handling batched events, durable background processing, protected administration, and end-to-end Preview testing.</p></div>
        <div><strong>Production</strong><p>Disabled pending separate validation and authorization.</p></div>
      </div>
      <div className="actions action-row">
        <a href="mailto:signallinkprotocol@yahoo.com?subject=SignalLink%20healthcare%20integration%20inquiry">Contact SignalLink</a>
        <a className="secondary-action" href="https://github.com/Drewbiee123/Signallink-AI/pull/49" target="_blank" rel="noopener noreferrer">Review implementation</a>
        <Link className="secondary-action" href="/">Visit SignalLink home</Link>
      </div>
      <p className="payment-note">SignalLink Protocol LLC · CAGE 16WJ1 · <a href="https://aiprov.org">aiprov.org</a>.
        This page describes SignalLink&apos;s proposed integration and does not imply athenahealth endorsement.</p>
    </main>
  );
}
