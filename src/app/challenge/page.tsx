import Link from "next/link";

const expected = "b325608828a14df655f1b81d3a452cbd490292e6f3b5af6cae87bb4e1f0e8c77";

export default function ChallengePage() {
  return (
    <main>
      <p className="eyebrow">SIGNALLINK PUBLIC REPRODUCIBILITY CHALLENGE #1</p>
      <h1>Do not trust SignalLink. Reproduce the result yourself.</h1>
      <p className="lead">
        This challenge gives independent developers, integrators, auditors, researchers, and federal/prime technical teams a fixed public input and an exact expected SHA-256 result. A participant can use any language or toolchain.
      </p>

      <section>
        <div><span>Challenge</span><strong>Federal Source-State SHA-256</strong></div>
        <div><span>Federal reference</span><strong>NIST NVD · CVE-2021-44228</strong></div>
        <div><span>Expected result</span><strong>Deterministic reproduction</strong></div>
      </section>

      <article className="offer featured">
        <p className="offer-code">EXPECTED SHA-256</p>
        <p className="evidence"><code>{expected}</code></p>
      </article>

      <h2>Independent procedure</h2>
      <ol>
        <li>Open the published JSON challenge vector.</li>
        <li>Use only the <code>payload</code> object as the test input.</li>
        <li>Recursively sort object keys lexicographically while preserving array order.</li>
        <li>Serialize as compact JSON with no extra whitespace.</li>
        <li>Compute SHA-256 over the UTF-8 canonical string.</li>
        <li>Compare the digest with the published expected value above.</li>
        <li>Post PASS or FAIL, your language/tool, canonical string, and computed digest in the open review issue.</li>
      </ol>

      <div className="actions action-row">
        <Link href="/challenges/federal-repro-v1.json">Open test vector</Link>
        <a href="https://github.com/Drewbiee123/Signallink-AI/issues/9" className="secondary-action">Post independent result</a>
        <a href="https://github.com/Drewbiee123/Signallink-AI/blob/main/scripts/reproduce-federal-challenge.mjs" className="secondary-action">Inspect verifier</a>
      </div>

      <div className="notice">
        <strong>One-command reference reproduction</strong>
        <p><code>node scripts/reproduce-federal-challenge.mjs</code></p>
        <p>The provided script is only a reference implementation. Stronger evidence comes from reproducing the result independently in another implementation or toolchain.</p>
      </div>

      <div className="notice">
        <strong>Evidence boundary</strong>
        <p>
          A PASS means an independent implementation reproduced the same deterministic canonical representation and SHA-256 digest from the same published input. It does not mean NIST, CISA, DoD, the U.S. Government, GitHub, Vercel, Sigstore, or another organization certified or endorsed SignalLink. The NIST NVD identifier is a federal-source reference used to exercise the provenance workflow; authoritative vulnerability facts remain with NIST/NVD.
        </p>
      </div>

      <p className="quote">Reproducible evidence should survive distrust.</p>
    </main>
  );
}
