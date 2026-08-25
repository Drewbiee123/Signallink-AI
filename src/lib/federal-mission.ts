import { canonicalize } from "@/lib/canonicalize";
import { sha256hex } from "@/lib/hashing";
import { signString } from "@/lib/signing";

export type ActionLevel = "MONITOR" | "REVIEW" | "ACTION" | "MISSION_CRITICAL_REVIEW";

export interface FederalEvidenceEnvelope {
  schema: "signallink.federal-evidence.v1";
  source: string;
  source_url: string;
  source_record_id: string;
  retrieved_at: string;
  source_sha256: string;
  assessment_sha256: string;
  signature: string | null;
  signature_status: "SIGNED" | "UNAVAILABLE";
  action_level: ActionLevel;
  mission_relevance_score: number;
  rationale: string[];
  recommended_action: string;
  evidence_boundary: string;
}

export function scoreFederalVulnerability(input: {
  cvssScore?: number | null;
  severity?: string | null;
  knownExploited?: boolean;
  modifiedRecently?: boolean;
}): { score: number; action: ActionLevel; rationale: string[]; recommendedAction: string } {
  const cvss = Math.max(0, Math.min(10, input.cvssScore || 0));
  const sev = (input.severity || "").toUpperCase();
  const knownExploited = Boolean(input.knownExploited);
  const modifiedRecently = Boolean(input.modifiedRecently);

  let score = (cvss / 10) * 0.55;
  if (knownExploited) score += 0.35;
  if (modifiedRecently) score += 0.05;
  if (sev === "CRITICAL") score += 0.05;
  score = Math.min(1, score);

  const rationale: string[] = [];
  if (cvss) rationale.push(`CVSS base score ${cvss.toFixed(1)}/10.`);
  if (knownExploited) rationale.push("Record is identified as known exploited in NVD/CISA KEV-enriched data.");
  if (modifiedRecently) rationale.push("Federal source record was modified within the recent review window.");
  if (sev) rationale.push(`Federal source severity is ${sev}.`);

  let action: ActionLevel = "MONITOR";
  let recommendedAction = "Track the record and reassess if exploit, exposure, or mission context changes.";
  if (score >= 0.85) {
    action = "MISSION_CRITICAL_REVIEW";
    recommendedAction = "Initiate immediate mission-owner technical review, asset exposure validation, mitigation planning, and evidence capture.";
  } else if (score >= 0.65) {
    action = "ACTION";
    recommendedAction = "Validate affected assets promptly, evaluate mitigations, and preserve a before/after evidence record.";
  } else if (score >= 0.4) {
    action = "REVIEW";
    recommendedAction = "Perform targeted technical review and determine whether the affected technology exists in the mission boundary.";
  }

  return { score: Number(score.toFixed(3)), action, rationale, recommendedAction };
}

export function createFederalEvidenceEnvelope(args: {
  source: string;
  sourceUrl: string;
  sourceRecordId: string;
  sourceRecord: unknown;
  assessment: unknown;
  actionLevel: ActionLevel;
  score: number;
  rationale: string[];
  recommendedAction: string;
  boundary: string;
}): FederalEvidenceEnvelope {
  const retrievedAt = new Date().toISOString();
  const sourceHash = sha256hex(canonicalize(args.sourceRecord));
  const assessmentHash = sha256hex(canonicalize({
    source: args.source,
    source_record_id: args.sourceRecordId,
    retrieved_at: retrievedAt,
    source_sha256: sourceHash,
    assessment: args.assessment,
    action_level: args.actionLevel,
    mission_relevance_score: args.score
  }));

  let signature: string | null = null;
  let signatureStatus: "SIGNED" | "UNAVAILABLE" = "UNAVAILABLE";
  try {
    signature = signString(`${assessmentHash}|${retrievedAt}`);
    signatureStatus = "SIGNED";
  } catch {
    // Federal-source analysis must remain available even if a deployment has no signing secret.
  }

  return {
    schema: "signallink.federal-evidence.v1",
    source: args.source,
    source_url: args.sourceUrl,
    source_record_id: args.sourceRecordId,
    retrieved_at: retrievedAt,
    source_sha256: sourceHash,
    assessment_sha256: assessmentHash,
    signature,
    signature_status: signatureStatus,
    action_level: args.actionLevel,
    mission_relevance_score: args.score,
    rationale: args.rationale,
    recommended_action: args.recommendedAction,
    evidence_boundary: args.boundary
  };
}
