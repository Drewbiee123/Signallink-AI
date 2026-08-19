"use client";

import { useState } from "react";
import Link from "next/link";

type AnchorReceipt = {
  anchor_id: string;
  timestamp: string;
  hash_algorithm: "SHA-256";
  hash: string;
  signature: string;
  status: "CREATED";
};

const starter = JSON.stringify({
  event: "GENESIS-LIVE-001",
  origin: "SignalLink Protocol LLC / SignalLink AI",
  framework: "ADA-4WM",
  provenance_layer: 33,
  assurance_tier: "Tier 1-A"
}, null, 2);

export default function AnchorPage() {
  const [payloadText, setPayloadText] = useState(starter);
  const [receipt, setReceipt] = useState<AnchorReceipt | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function createAnchor() {
    setBusy(true);
    setError("");
    setReceipt(null);
    try {
      const payload = JSON.parse(payloadText);
      const response = await fetch("/api/anchor/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payload,
          metadata: {
            source: "signalink-web-gateway",
            framework: "ADA-4WM",
            assurance_tier: "Tier 1-A",
            provenance_layer: 33
          }
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || `Anchor request failed (${response.status})`);
      setReceipt(body as AnchorReceipt);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create anchor");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <p className="eyebrow">SIGNALLINK ANCHOR GATEWAY</p>
      <h1>Create a verifiable evidence receipt.</h1>
      <p className="lead">JSON is canonicalized, hashed with SHA-256, bound to an ISO timestamp, cryptographically signed, and persisted to the SignalLink anchor ledger.</p>

      <div className="tool-panel">
        <label htmlFor="payload">Evidence payload (JSON)</label>
        <textarea id="payload" className="code-input" rows={16} value={payloadText} onChange={(event) => setPayloadText(event.target.value)} spellCheck={false} />
        <button type="button" onClick={createAnchor} disabled={busy}>{busy ? "Creating anchor…" : "Create anchor"}</button>
      </div>

      {error ? <div className="error-box" role="alert">{error}</div> : null}

      {receipt ? (
        <>
          <div className="success-box" role="status">Anchor created and persisted.</div>
          <dl className="evidence">
            <div><dt>Anchor ID</dt><dd>{receipt.anchor_id}</dd></div>
            <div><dt>Timestamp</dt><dd>{receipt.timestamp}</dd></div>
            <div><dt>Algorithm</dt><dd>{receipt.hash_algorithm}</dd></div>
            <div><dt>SHA-256</dt><dd>{receipt.hash}</dd></div>
            <div><dt>Signature</dt><dd>{receipt.signature}</dd></div>
          </dl>
          <details className="receipt-json">
            <summary>Copy verification packet</summary>
            <pre>{JSON.stringify({ payload: JSON.parse(payloadText), timestamp: receipt.timestamp, hash: receipt.hash, signature: receipt.signature }, null, 2)}</pre>
          </details>
        </>
      ) : null}

      <div className="actions action-row">
        <Link href="/verify">Verify an anchor</Link>
        <Link href="/" className="secondary-action">Back home</Link>
      </div>
      <p className="quote">“Even your house was born on your foundation.”</p>
    </main>
  );
}
