import { NextResponse } from "next/server";
import { createFederalEvidenceEnvelope, scoreFederalVulnerability } from "@/lib/federal-mission";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NVD_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";

function metricFromCve(cve: any): { score: number | null; severity: string | null } {
  const metrics = cve?.metrics || {};
  const candidates = [
    ...(metrics.cvssMetricV40 || []),
    ...(metrics.cvssMetricV31 || []),
    ...(metrics.cvssMetricV30 || []),
    ...(metrics.cvssMetricV2 || [])
  ];
  const primary = candidates.find((item: any) => item?.type === "Primary") || candidates[0];
  const cvss = primary?.cvssData;
  return {
    score: typeof cvss?.baseScore === "number" ? cvss.baseScore : null,
    severity: typeof cvss?.baseSeverity === "string" ? cvss.baseSeverity : (typeof primary?.baseSeverity === "string" ? primary.baseSeverity : null)
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cve = (url.searchParams.get("cve") || "").trim().toUpperCase();
  if (!/^CVE-\d{4}-\d{4,}$/.test(cve)) {
    return NextResponse.json({
      error: "Provide a CVE ID, for example ?cve=CVE-2021-44228",
      source: "NIST National Vulnerability Database"
    }, { status: 400 });
  }

  const sourceUrl = `${NVD_BASE}?cveIds=${encodeURIComponent(cve)}`;
  const headers: Record<string, string> = { "user-agent": "SignalLink-Protocol-Federal-Mission-Gateway/1.0" };
  if (process.env.NVD_API_KEY) headers.apiKey = process.env.NVD_API_KEY;

  try {
    const response = await fetch(sourceUrl, { headers, cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: "NVD request failed", status: response.status }, { status: 502 });
    }
    const payload = await response.json();
    const vulnerability = payload?.vulnerabilities?.[0];
    const record = vulnerability?.cve;
    if (!record) return NextResponse.json({ error: "CVE not found in NVD" }, { status: 404 });

    const metric = metricFromCve(record);
    const knownExploited = Boolean(record.cisaExploitAdd || record.cisaActionDue || record.cisaRequiredAction);
    const modified = typeof record.lastModified === "string" ? Date.parse(record.lastModified) : NaN;
    const modifiedRecently = Number.isFinite(modified) && Date.now() - modified <= 30 * 24 * 60 * 60 * 1000;
    const scored = scoreFederalVulnerability({
      cvssScore: metric.score,
      severity: metric.severity,
      knownExploited,
      modifiedRecently
    });

    const descriptions = Array.isArray(record.descriptions) ? record.descriptions : [];
    const description = descriptions.find((item: any) => item?.lang === "en")?.value || null;
    const assessment = {
      cve_id: record.id,
      published: record.published || null,
      last_modified: record.lastModified || null,
      vuln_status: record.vulnStatus || null,
      cvss_base_score: metric.score,
      severity: metric.severity,
      known_exploited: knownExploited,
      cisa_action_due: record.cisaActionDue || null,
      cisa_required_action: record.cisaRequiredAction || null,
      description
    };

    const evidence = createFederalEvidenceEnvelope({
      source: "NIST National Vulnerability Database (NVD)",
      sourceUrl,
      sourceRecordId: record.id,
      sourceRecord: record,
      assessment,
      actionLevel: scored.action,
      score: scored.score,
      rationale: scored.rationale,
      recommendedAction: scored.recommendedAction,
      boundary: "NVD supplies the federal vulnerability record. SignalLink computes the mission-relevance assessment and cryptographic evidence receipt. This response is not NIST, CISA, government, or third-party certification, endorsement, or an agency risk determination."
    });

    return NextResponse.json({ assessment, evidence }, {
      headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" }
    });
  } catch (error) {
    console.error("Federal NVD assessment failed", error);
    return NextResponse.json({ error: "Federal vulnerability assessment is temporarily unavailable" }, { status: 503 });
  }
}
