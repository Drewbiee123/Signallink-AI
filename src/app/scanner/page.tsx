"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type Receipt = {
  payload: {
    file: { name: string; media_kind: string; size_bytes: number; sha256: string };
    findings: Record<string, { status: string; reason: string } | string>;
    explanation: string;
  };
  timestamp: string;
  hash: string;
  signature: string;
  signature_type: string;
  anchor_id: string;
};

export default function ScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function scan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setReceipt(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/scan", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Scan failed");
      setReceipt(result as Receipt);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Scan failed");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!receipt) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `signallink-scan-${receipt.anchor_id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <main>
    <p className="eyebrow">SIGNALLINK MEDIA EVIDENCE</p>
    <h1>Give a file a verifiable fingerprint.</h1>
    <p className="lead">Upload an image, audio file, or video. Receive a timestamped SHA-256 receipt you can download and check later. Media origin detection is not yet available; the report states exactly which checks ran.</p>
    <div className="notice"><strong>What this scan establishes</strong><p>The fingerprint identifies the exact bytes submitted. A changed file has a different hash. A valid receipt confirms what SignalLink signed; it does not prove who created the file or when the file itself was made.</p></div>
    <form className="tool-panel" onSubmit={scan}>
      <label htmlFor="scan-file">Select media (JPEG, PNG, WebP, MP3, FLAC, Ogg, WAV, MP4, WebM; up to 10 MB)</label>
      <input id="scan-file" type="file" accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/flac,audio/ogg,audio/wav,video/mp4,video/webm" required onChange={event => setFile(event.target.files?.[0] || null)} />
      <button type="submit" disabled={busy || !file}>{busy ? "Creating receipt…" : "Scan and create receipt"}</button>
    </form>
    {error && <p role="alert" className="error-box">{error}</p>}
    {receipt && <div className="notice" role="status">
      <strong>Origin inconclusive · receipt created</strong>
      <p>{receipt.payload.explanation}</p>
      <dl className="evidence">
        <div><dt>File</dt><dd>{receipt.payload.file.name} ({receipt.payload.file.media_kind})</dd></div>
        <div><dt>File SHA-256</dt><dd>{receipt.payload.file.sha256}</dd></div>
        <div><dt>Receipt SHA-256</dt><dd>{receipt.hash}</dd></div>
        <div><dt>Scan time (UTC)</dt><dd>{receipt.timestamp}</dd></div>
        <div><dt>Signature mode</dt><dd>{receipt.signature_type === "PUBLIC_KEY" ? "Public-key signature" : "Server-only HMAC verification"}</dd></div>
      </dl>
      <h2>Checks</h2>
      <ul>{Object.entries(receipt.payload.findings).map(([name, result]) => <li key={name}><b>{name}:</b> {typeof result === "string" ? result : `${result.status} — ${result.reason}`}</li>)}</ul>
      <div className="actions action-row"><button type="button" onClick={download}>Download JSON receipt</button><Link href="/verify">Verify receipt</Link>{receipt.signature_type === "PUBLIC_KEY" && <a href="/api/scan/public-key" download>Download public key</a>}</div>
    </div>}
    <div className="offer-grid">
      <article className="offer"><h2>Evidence Analysis</h2><p>Professional review of a scoped evidence submission with structured findings and a provenance receipt.</p><p className="price">$49</p><Link href="/services">View available service</Link></article>
      <article className="offer"><h2>Consumer plans</h2><p>Scan packs and unlimited plans are being prepared. Billing will open when account access, usage metering, and supported detector results are connected.</p></article>
    </div>
    <p className="payment-note">Install this site from your browser’s Add to Home Screen menu when available. The app needs a connection to create a receipt. Files are processed for the receipt and are not stored by this route. The ledger stores the hashes and receipt metadata.</p>
  </main>;
}
