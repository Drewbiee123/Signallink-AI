"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import "./proof-corridor.css";

type CaseState = { amount: number; international: boolean; managerApproved: boolean; enhancedVerification: boolean };
type AnchorReceipt = { anchor_id: string; timestamp: string; hash: string; signature: string };

const rules = [
  { id: "R1", text: "Amount above $10,000 requires manager approval." },
  { id: "R2", text: "An international transaction requires enhanced verification." },
  { id: "R3", text: "A transaction is allowed only when every required condition is satisfied." }
];

export default function ProofCorridorPage() {
  const [caseState, setCaseState] = useState<CaseState>({ amount: 12500, international: true, managerApproved: true, enhancedVerification: false });
  const [receipt, setReceipt] = useState<AnchorReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const proof = useMemo(() => {
    const managerRequired = caseState.amount > 10000;
    const enhancedRequired = caseState.international;
    const missing: string[] = [];
    if (managerRequired && !caseState.managerApproved) missing.push("manager approval (R1)");
    if (enhancedRequired && !caseState.enhancedVerification) missing.push("enhanced verification (R2)");
    const allowed = missing.length === 0;
    return {
      requested_claim: "TRANSACTION_ALLOWED",
      verdict: allowed ? "PROVEN" : "NOT_PROVEN",
      formalization: {
        A: `amount (${caseState.amount}) > 10000 = ${managerRequired}`,
        I: `international = ${caseState.international}`,
        M: `manager_approved = ${caseState.managerApproved}`,
        V: `enhanced_verification = ${caseState.enhancedVerification}`,
        rule: "ALLOW = (not A or M) and (not I or V)"
      },
      missing_conditions: missing,
      trace: [
        `R1: manager approval ${managerRequired ? "is required" : "is not required"} — ${!managerRequired || caseState.managerApproved ? "SATISFIED" : "MISSING"}`,
        `R2: enhanced verification ${enhancedRequired ? "is required" : "is not required"} — ${!enhancedRequired || caseState.enhancedVerification ? "SATISFIED" : "MISSING"}`,
        `R3: all required conditions satisfied = ${allowed}`
      ]
    };
  }, [caseState]);

  const packet = useMemo(() => ({
    demonstration: "TreeOfKnowledge + SignalLink Proof Corridor",
    evidence_boundary: "SignalLink demonstration policy kernel; no TreeOfKnowledge source code is included or executed.",
    attribution: {
      reasoning_engine: "TreeOfKnowledge concept and engine — JAnica Tesla Zrinski",
      provenance_layer: "SignalLink Protocol LLC"
    },
    source_case: caseState,
    rules,
    proof
  }), [caseState, proof]);

  async function anchorProof() {
    setBusy(true); setError(""); setReceipt(null);
    try {
      const response = await fetch("/api/anchor/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payload: packet, metadata: { source: "proof-corridor-demo", framework: "ADA-4WM", assurance_tier: "Tier 1-A", provenance_layer: 33 } })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || `Anchor request failed (${response.status})`);
      setReceipt(body as AnchorReceipt);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to anchor proof");
    } finally { setBusy(false); }
  }

  return (
    <main>
      <p className="eyebrow">TREEOFKNOWLEDGE × SIGNALLINK</p>
      <h1>AI interprets. The tree proves. SignalLink preserves the evidence.</h1>
      <p className="lead">A deliberately small demonstration: human-readable policy becomes visible formal logic, a deterministic check produces a verdict and trace, and SignalLink binds the complete record to a timestamp and cryptographic receipt.</p>

      <ol className="flow-list" aria-label="Proof corridor order of operation">
        <li><b>1. Understand</b><span>AI or a person extracts the facts and rules.</span></li>
        <li><b>2. Confirm</b><span>A human reviews what the system understood.</span></li>
        <li><b>3. Prove</b><span>The symbolic layer returns PROVEN or NOT PROVEN.</span></li>
        <li><b>4. Anchor</b><span>SignalLink seals the inputs, rules, trace, and result.</span></li>
        <li><b>5. Verify</b><span>Any later change produces a different SHA-256 digest.</span></li>
      </ol>

      <div className="split-grid">
        <div className="tool-panel">
          <p className="offer-code">STEP 1–2 · REVIEW THE FORMALIZATION</p>
          <label htmlFor="amount">Transaction amount (USD)</label>
          <input id="amount" className="plain-input" type="number" min="0" value={caseState.amount} onChange={(event) => setCaseState({ ...caseState, amount: Number(event.target.value) })} />
          <label className="check-row"><input type="checkbox" checked={caseState.international} onChange={(event) => setCaseState({ ...caseState, international: event.target.checked })} /> International transaction</label>
          <label className="check-row"><input type="checkbox" checked={caseState.managerApproved} onChange={(event) => setCaseState({ ...caseState, managerApproved: event.target.checked })} /> Manager approval present</label>
          <label className="check-row"><input type="checkbox" checked={caseState.enhancedVerification} onChange={(event) => setCaseState({ ...caseState, enhancedVerification: event.target.checked })} /> Enhanced verification present</label>
        </div>

        <div className="tool-panel">
          <p className="offer-code">STEP 3 · DETERMINISTIC VERDICT</p>
          <div className={proof.verdict === "PROVEN" ? "proof-verdict proven" : "proof-verdict not-proven"}>{proof.verdict.replace("_", " ")}</div>
          <p className="proof-formula">ALLOW = (¬A ∨ M) ∧ (¬I ∨ V)</p>
          <ul className="trace-list">{proof.trace.map((step) => <li key={step}>{step}</li>)}</ul>
          {proof.missing_conditions.length ? <p className="missing">Missing: {proof.missing_conditions.join(", ")}</p> : <p className="complete">Every required condition is present.</p>}
        </div>
      </div>

      <div className="tool-panel">
        <p className="offer-code">STEP 4–5 · SIGNALLINK EVIDENCE RECEIPT</p>
        <p>The receipt covers the source case, formalized rules, verdict, missing conditions, reasoning trace, attribution, and evidence boundary—not merely the final sentence.</p>
        <button type="button" onClick={anchorProof} disabled={busy}>{busy ? "Anchoring complete proof…" : "Create tamper-evident proof receipt"}</button>
      </div>

      {error ? <div className="error-box" role="alert">{error}</div> : null}
      {receipt ? <div className="success-box" role="status"><strong>RECEIPT CREATED</strong><p>Anchor ID: <span className="reference">{receipt.anchor_id}</span></p><p>UTC: <span className="reference">{receipt.timestamp}</span></p><p>SHA-256: <span className="reference">{receipt.hash}</span></p></div> : null}

      <details className="receipt-json"><summary>Inspect the exact evidence packet</summary><pre>{JSON.stringify(packet, null, 2)}</pre></details>

      <div className="difference-grid">
        <div><span>TREEOFKNOWLEDGE CONTRIBUTION</span><strong>Was the conclusion logically derived?</strong><p>Explicit formulas, deterministic evaluation, and an inspectable reasoning path.</p></div>
        <div><span>SIGNALLINK CONTRIBUTION</span><strong>Can we prove what was evaluated?</strong><p>Canonical evidence, UTC binding, SHA-256 integrity, signature, persistence, and later verification.</p></div>
      </div>

      <div className="pending"><strong>Honest demonstration boundary</strong><p>This page demonstrates the proposed integration contract with a small independent policy kernel. It does not copy or execute TreeOfKnowledge source code. Connecting the actual engine for commercial use requires Ana’s explicit written permission and a jointly approved adapter.</p></div>
      <div className="actions action-row"><Link href="/verify">Open independent verifier</Link><Link className="secondary-action" href="/">Back home</Link></div>
      <p className="quote">“Even your house was born on your foundation.”</p>
    </main>
  );
}
