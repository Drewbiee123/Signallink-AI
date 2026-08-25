import { NextResponse } from "next/server";
import { canonicalize } from "@/lib/canonicalize";
import { sha256hex } from "@/lib/hashing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAM_BASE = "https://api.sam.gov/opportunities/v2/search";
const ALLOWED = ["noticeid", "solnum", "title", "state", "zip", "ptype", "typeOfSetAside", "ncode", "ccode", "postedFrom", "postedTo", "rdlfrom", "rdlto"] as const;

function clampLimit(value: string | null): string {
  const parsed = Number(value || 25);
  if (!Number.isFinite(parsed)) return "25";
  return String(Math.max(1, Math.min(100, Math.floor(parsed))));
}

export async function GET(request: Request) {
  const key = process.env.SAM_API_KEY;
  if (!key) {
    return NextResponse.json({
      status: "NOT_CONFIGURED",
      error: "SAM_API_KEY is not configured on the server.",
      boundary: "The SAM.gov public Opportunities API requires a personal/public API key. The key must remain server-side and is never returned to clients."
    }, { status: 503 });
  }

  const incoming = new URL(request.url);
  const upstream = new URL(SAM_BASE);
  upstream.searchParams.set("api_key", key);
  upstream.searchParams.set("limit", clampLimit(incoming.searchParams.get("limit")));
  upstream.searchParams.set("offset", String(Math.max(0, Number(incoming.searchParams.get("offset") || 0) || 0)));

  for (const name of ALLOWED) {
    const value = incoming.searchParams.get(name);
    if (value) upstream.searchParams.set(name, value.slice(0, 500));
  }

  if (!upstream.searchParams.get("postedFrom") || !upstream.searchParams.get("postedTo")) {
    return NextResponse.json({
      error: "postedFrom and postedTo are required by the SAM.gov public Opportunities API when using this gateway. Use MM/DD/YYYY.",
      example: "/api/federal/sam?postedFrom=08/01/2026&postedTo=08/25/2026&title=artificial%20intelligence&limit=25"
    }, { status: 400 });
  }

  try {
    const response = await fetch(upstream, { cache: "no-store", headers: { "user-agent": "SignalLink-Protocol-Federal-Capture-Gateway/1.0" } });
    const text = await response.text();
    let payload: any;
    try { payload = JSON.parse(text); } catch { payload = { raw: text.slice(0, 5000) }; }
    if (!response.ok) {
      return NextResponse.json({ error: "SAM.gov request failed", status: response.status, upstream: payload }, { status: 502 });
    }

    const opportunities = Array.isArray(payload?.opportunitiesData) ? payload.opportunitiesData : [];
    const records = opportunities.map((opp: any) => ({
      notice_id: opp.noticeId || null,
      solicitation_number: opp.solicitationNumber || null,
      title: opp.title || null,
      organization: opp.fullParentPathName || opp.department || null,
      posted_date: opp.postedDate || null,
      response_deadline: opp.responseDeadLine || null,
      type: opp.type || null,
      set_aside: opp.typeOfSetAsideDescription || opp.typeOfSetAside || null,
      naics: opp.naicsCode || null,
      classification_code: opp.classificationCode || null,
      ui_link: opp.uiLink || null,
      source_sha256: sha256hex(canonicalize(opp))
    }));

    return NextResponse.json({
      schema: "signallink.federal-capture.v1",
      source: "SAM.gov Contract Opportunities",
      retrieved_at: new Date().toISOString(),
      count: records.length,
      opportunities: records,
      evidence_boundary: "SAM.gov supplies the opportunity records. SignalLink adds normalized fields and deterministic record hashes. Presence here is not an award, endorsement, qualification determination, or government selection."
    }, { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  } catch (error) {
    console.error("SAM federal capture request failed", error);
    return NextResponse.json({ error: "Federal opportunity capture is temporarily unavailable" }, { status: 503 });
  }
}
