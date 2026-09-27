"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

const billingOpen = process.env.NEXT_PUBLIC_SCANNER_BILLING_ENABLED === "true";

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
  const [token, setToken] = useState("");
  const [access, setAccess] = useState("Check or claim your access key to scan.");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);

  function saveKey(value: string) {
    localStorage.setItem("signallink_scanner_key", value);
    let previous: string[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem("signallink_scanner_keys") || "[]");
      if (Array.isArray(parsed)) previous = parsed.filter(key => typeof key === "string" && /^[a-f0-9]{64}$/.test(key));
    } catch { /* Reset malformed local storage. */ }
    const keys = Array.from(new Set([...previous, value]));
    localStorage.setItem("signallink_scanner_keys", JSON.stringify(keys));
    setSavedKeys(keys);
  }

  useEffect(() => {
    const saved = localStorage.getItem("signallink_scanner_key");
    try { setSavedKeys(JSON.parse(localStorage.getItem("signallink_scanner_keys") || "[]")); } catch { setSavedKeys([]); }
    if (saved) {
      setToken(saved);
      void checkAccess(saved);
    }
  }, []);

  async function checkAccess(value = token) {
    if (!/^[a-f0-9]{64}$/.test(value)) {
      setAccess("Enter a valid 64-character access key.");
      return;
    }
    try {
      const response = await fetch("/api/scanner/access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "status", token: value }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Access check failed");
      setAccess(result.status === "active" ? result.remaining === null ? "Active monthly access" : `${result.remaining} scans remaining` : result.status === "pending" ? "Payment is processing. Check again shortly." : "Access is inactive.");
      setRemaining(result.remaining);
      saveKey(value);
    } catch (cause) {
      setAccess(cause instanceof Error ? cause.message : "Access check failed");
    }
  }

  async function claimFree() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/scanner/access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "free" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Free scans unavailable");
      setToken(result.token); saveKey(result.token);
      setAccess("3 scans remaining"); setRemaining(3);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Free scans unavailable"); }
    finally { setBusy(false); }
  }

  async function buy(plan: "pack10" | "monthly") {
    setBusy(true); setError("");
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const purchaseToken = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
      const response = await fetch("/api/scanner/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan, token: purchaseToken }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Checkout unavailable");
      saveKey(purchaseToken);
      window.location.assign(result.url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Checkout unavailable"); setBusy(false); }
  }

  async function manageBilling() {
    try {
      const response = await fetch("/api/scanner/portal", { method: "POST", headers: { authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Billing portal unavailable");
      window.location.assign(result.url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Billing portal unavailable"); }
  }

  async function cancelRenewal() {
    if (!window.confirm("Cancel renewal at the end of your current billing period?")) return;
    try {
      const response = await fetch("/api/scanner/cancel", { method: "POST", headers: { authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Cancellation unavailable");
      setAccess(result.renewal_cancelled ? "Renewal cancelled. Access continues through the paid billing period." : "Cancellation could not be confirmed.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Cancellation unavailable"); }
  }

  async function scan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setReceipt(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/scan", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Scan failed");
      setReceipt(result as Receipt);
      void checkAccess(token);
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
    <p className="lead">Upload an image, audio file, or video. Receive a timestamped SHA-256 receipt and a C2PA manifest validation result you can download and check later. The report states exactly which checks ran.</p>
    <div className="notice"><strong>What this scan establishes</strong><p>The fingerprint identifies the exact bytes submitted. A changed file has a different hash. A valid receipt confirms what SignalLink signed; it does not prove who created the file or when the file itself was made.</p></div>
    <div className="tool-panel">
      <h2>Access</h2><p role="status">{access}</p>
      <label htmlFor="scan-key">Your access key</label>
      <input id="scan-key" className="code-input" value={token} onChange={event => setToken(event.target.value.trim())} placeholder="Paste your 64-character access key" autoComplete="off" spellCheck={false} />
      {savedKeys.length > 0 && <label>Saved keys on this device<select value={token} onChange={event => { setToken(event.target.value); void checkAccess(event.target.value); }}><option value="">Select an access key</option>{savedKeys.map((key, index) => <option key={key} value={key}>Key {index + 1} · …{key.slice(-8)}</option>)}</select></label>}
      <div className="actions action-row"><button type="button" onClick={() => void checkAccess()} disabled={busy}>Check and save key</button><button type="button" onClick={() => void claimFree()} disabled={busy}>Claim 3 free scans</button></div>
      {billingOpen && <button type="button" onClick={() => void manageBilling()} disabled={busy || !token}>Manage or cancel subscription</button>}
      {billingOpen && <button type="button" onClick={() => void cancelRenewal()} disabled={busy || !token}>Cancel renewal directly</button>}
      <p>Keep your key to use purchased scans on another device. Anyone with your key can use its remaining scans. Your browser stores the key on this device.</p>
    </div>
    <form className="tool-panel" onSubmit={scan}>
      <label htmlFor="scan-file">Select media (JPEG, PNG, WebP, MP3, FLAC, Ogg, WAV, MP4, WebM; up to 10 MB)</label>
      <input id="scan-file" type="file" accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/flac,audio/ogg,audio/wav,video/mp4,video/webm" required onChange={event => setFile(event.target.files?.[0] || null)} />
      <button type="submit" disabled={busy || !file || !/^[a-f0-9]{64}$/.test(token) || remaining === 0}>{busy ? "Creating receipt…" : "Scan and create receipt"}</button>
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
      <div className="actions action-row"><button type="button" onClick={download}>Download JSON receipt</button><Link href="/verify">Verify receipt online</Link><a href="/api/scan/public-key" download>Download public key</a><a href="/verify-media-receipt.mjs" download>Download offline verifier</a></div>
      <p>Offline verification: save the receipt, original file, public key, and verifier in one folder, then run <code>node verify-media-receipt.mjs receipt.json original-file public-key.pem</code>. Keep the key with your receipt for future verification.</p>
    </div>}
    <div className="offer-grid">
      <article className="offer"><h2>Evidence Analysis</h2><p>Professional review of a scoped evidence submission with structured findings and a provenance receipt.</p><p className="price">$49</p><Link href="/services">View available service</Link></article>
      <article className="offer"><h2>10 scan credits</h2><p>Ten file fingerprint and C2PA checks with downloadable signed receipts. Credits do not expire.</p><p className="price">$4.99</p>{billingOpen ? <button type="button" disabled={busy} onClick={() => void buy("pack10")}>Buy 10 scans</button> : <p>Purchases are not open yet.</p>}</article>
      <article className="offer"><h2>Unlimited monthly scans</h2><p>No monthly scan cap. Each scan includes a file fingerprint, C2PA check, and signed receipt. Up to 15 scans per minute; manage or cancel renewal any time.</p><p className="price">$9.99 / month</p>{billingOpen ? <button type="button" disabled={busy} onClick={() => void buy("monthly")}>Subscribe</button> : <p>Subscriptions are not open yet.</p>}</article>
    </div>
    <p className="payment-note">Install this site from your browser’s Add to Home Screen menu when available. The app needs a connection to create a receipt. Files are processed for the receipt and are not stored by this route. The ledger stores the hashes and receipt metadata.</p>
    <p><Link href="/scanner/support">Need help with an access key, payment, or receipt? Contact support.</Link></p>
    <p><Link href="/scanner/about">Read scan limits, billing, and data handling.</Link></p>
  </main>;
}
