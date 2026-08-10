"use client";

import { ChangeEvent, useMemo, useState } from "react";

type Mode = "evidence" | "report" | "chat" | "code";
type Receipt = {
  receipt_id: string;
  timestamp: string;
  mode: Mode;
  model: string;
  input_sha256: string;
  record_sha256: string;
  origin: string;
  anchor_phrase: string;
};

const modes: { id: Mode; label: string; helper: string }[] = [
  { id: "evidence", label: "Analyze Evidence", helper: "Find facts, gaps, contradictions, and verification steps." },
  { id: "report", label: "Generate Report", helper: "Turn supplied material into a provenance-ready report." },
  { id: "chat", label: "SignalLink Chat", helper: "Ask Grok a clear question through the secure server route." },
  { id: "code", label: "Review Code", helper: "Find bugs, security risks, and corrected code." },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("evidence");
  const [input, setInput] = useState("");
  const [fileName, setFileName] = useState("");
  const [output, setOutput] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activeMode = useMemo(() => modes.find((item) => item.id === mode)!, [mode]);

  async function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setFileName(file.name);
    if (file.size > 2_000_000) {
      setError("For Phase 1, upload a text-based file smaller than 2 MB.");
      return;
    }
    try {
      setInput(await file.text());
    } catch {
      setError("This file could not be read as text.");
    }
  }

  async function submit() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError("");
    setOutput("");
    setReceipt(null);
    try {
      const response = await fetch("/api/grok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Request failed.");
      setOutput(data.output);
      setReceipt(data.receipt);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  function downloadReceipt() {
    if (!receipt) return;
    const blob = new Blob([JSON.stringify({ receipt, output }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receipt.receipt_id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <header className="siteHeader">
        <a className="brand" href="#top" aria-label="SignalLink AI home">
          <span className="brandMark">SL</span>
          <span>SignalLink AI</span>
        </a>
        <span className="status"><i /> Provenance Console</span>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">SIGNALLINK PROTOCOL LLC · CAGE 16WJ1</p>
        <h1>Turn evidence and AI output into a verifiable record.</h1>
        <p className="lede">
          Analyze evidence, generate reports, review code, and create a timestamped
          SHA-256 receipt from one accessible workspace.
        </p>
        <div className="trustRow">
          <span>Server-side xAI connection</span>
          <span>SHA-256 receipts</span>
          <span>Keys never exposed to browsers</span>
        </div>
      </section>

      <section className="console" aria-label="SignalLink AI workspace">
        <nav className="modeTabs" aria-label="Analysis mode">
          {modes.map((item) => (
            <button
              key={item.id}
              className={mode === item.id ? "active" : ""}
              onClick={() => setMode(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="workspace">
          <section className="inputPanel">
            <div className="panelHeading">
              <div>
                <p className="step">01 · INPUT</p>
                <h2>{activeMode.label}</h2>
              </div>
              <label className="uploadButton">
                Upload text file
                <input
                  type="file"
                  accept=".txt,.md,.json,.csv,.js,.jsx,.ts,.tsx,.html,.css"
                  onChange={loadFile}
                />
              </label>
            </div>
            <p className="helper">{activeMode.helper}</p>
            {fileName && <p className="fileName">Loaded: {fileName}</p>}
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste evidence, a report request, a question, or code here…"
              aria-label="Material to analyze"
            />
            <button
              className="runButton"
              type="button"
              disabled={!input.trim() || loading}
              onClick={submit}
            >
              {loading ? "Creating anchored analysis…" : `Run ${activeMode.label}`}
            </button>
            {error && <p className="error" role="alert">{error}</p>}
          </section>

          <section className="outputPanel" aria-live="polite">
            <div className="panelHeading">
              <div>
                <p className="step">02 · OUTPUT</p>
                <h2>Anchored Result</h2>
              </div>
              {receipt && (
                <button className="receiptButton" onClick={downloadReceipt} type="button">
                  Download receipt
                </button>
              )}
            </div>
            {!output && !loading && (
              <div className="emptyState">
                <span>33</span>
                <p>Your analysis and provenance receipt will appear here.</p>
              </div>
            )}
            {loading && <div className="loader">Verifying input and contacting Grok…</div>}
            {output && <article className="result">{output}</article>}
            {receipt && (
              <dl className="receipt">
                <div><dt>Receipt</dt><dd>{receipt.receipt_id}</dd></div>
                <div><dt>Timestamp</dt><dd>{receipt.timestamp}</dd></div>
                <div><dt>Model</dt><dd>{receipt.model}</dd></div>
                <div><dt>Record SHA-256</dt><dd>{receipt.record_sha256}</dd></div>
              </dl>
            )}
          </section>
        </div>
      </section>

      <footer>
        <p>SignalLink Protocol LLC · “Even your house was born on your foundation.”</p>
        <p>ADA Tier 1-A · Keyboard accessible · High-contrast interface</p>
      </footer>
    </main>
  );
}
