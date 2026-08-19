"use client";

import { useState } from "react";
import Link from "next/link";

type VerifyResult = {
  status: "VALID" | "INVALID";
  hash_algorithm: "SHA-256";
  computed_hash: string;
  hash_valid: boolean;
  signature_valid: boolean;
};

const starter = JSON.stringify({
  payload: {
    event: "GENESIS-LIVE-001",
    origin: "SignalLink Protocol LLC / SignalLink AI",
    framework: "ADA-4WM",
    provenance_layer: 33,
    assurance_tier: "Tier 1-A"
  },
  timestamp: "",
  hash: "",
  signature: ""
}, null, 2);

export default function VerifyPage() {
  const [packetText, setPacketText] = useState(starter);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function verify() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const packet = JSON.parse(packetText);
      const response = await fetch("/api/anchor/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(packet)
      });
      const body = await response.json();
      if (response.status !== 200 && response.status !== 422) {
        throw new Error(body.error || `Verification request failed (${response.status})`);
      }
      setResult(body as VerifyResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to verify anchor");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <p className="eyebrow">SIGNALLINK VERIFY GATEWAY</p>
      <h1>Verify without trusting the original narrative.</h1>
      <p className="lead">Paste the payload, timestamp, SHA-256 digest, and signature. SignalLink independently recomputes the canonical digest and verifies the cryptographic binding.</p>

      <div className="tool-panel">
        <label htmlFor="packet">Verification packet (JSON)</label>
        <textarea id="packet" className="code-input" rows={20} value={packetText} onChange={(event) => setPacketText(event.target.value)} spellCheck={false} />
        <button type="button" onClick={verify} disabled={busy}>{busy ? "Verifying…" : "Verify anchor"}</button>
      </div>

      {error ? <div className="error-box" role="alert">{error}</div> : null}

      {result ? (
        <>
          <div className={result.status === "VALID" ? "success-box" : "error-box"} role="status">
            {result.status === "VALID" ? "VALID — payload, digest, and signature agree." : "INVALID — one or more integrity checks failed."}
          </div>
          <section aria-label="Verification result">
            <div><span>Status</span><strong>{result.status}</strong></div>
            <div><span>Hash</span><strong>{result.hash_valid ? "MATCH" : "MISMATCH"}</strong></div>
            <div><span>Signature</span><strong>{result.signature_valid ? "VALID" : "INVALID"}</strong></div>
          </section>
          <dl className="evidence"><div><dt>Computed SHA-256</dt><dd>{result.computed_hash}</dd></div></dl>
        </>
      ) : null}

      <div className="actions action-row">
        <Link href="/anchor">Create an anchor</Link>
        <Link href="/" className="secondary-action">Back home</Link>
      </div>
      <p className="quote">“Even your house was born on your foundation.”</p>
    </main>
  );
}
