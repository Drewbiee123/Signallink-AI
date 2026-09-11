import crypto from "node:crypto";

export function canonicalizeReplay(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizeReplay).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalizeReplay(value[key])}`).join(",")}}`;
}

export function replaySha256(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : canonicalizeReplay(value)).digest("hex");
}

const actorHints = [
  [/resource not accessible by integration|github app|oauth|scope/i, "INTEGRATION_PERMISSION"],
  [/branch protection|required check|review required/i, "POLICY_GATE"],
  [/third.party|vendor|external service|webhook/i, "THIRD_PARTY"],
  [/user|manual|operator/i, "HUMAN_OPERATOR"]
];

export function classifyReplayActor(step = {}) {
  const evidence = canonicalizeReplay(step);
  return actorHints.find(([pattern]) => pattern.test(evidence))?.[1] ?? "UNKNOWN";
}

export function firstReplayDivergence(baseline, observed) {
  const length = Math.max(baseline.length, observed.length);
  for (let index = 0; index < length; index += 1) {
    const expected = baseline[index] ?? null;
    const actual = observed[index] ?? null;
    if (canonicalizeReplay(expected) !== canonicalizeReplay(actual)) {
      return {
        index,
        expected,
        actual,
        actor_class: classifyReplayActor(actual ?? expected),
        expected_hash: replaySha256(expected),
        actual_hash: replaySha256(actual)
      };
    }
  }
  return null;
}

export function createCausalReplayReceipt({ workflow_id, baseline, observed, replay = null, recorded_at = new Date().toISOString() }, secret) {
  const divergence = firstReplayDivergence(baseline, observed);
  const replayDivergence = replay ? firstReplayDivergence(baseline, replay) : null;
  const record = {
    schema: "signallink.causal-replay.v1",
    workflow_id,
    recorded_at,
    baseline_hash: replaySha256(baseline),
    observed_hash: replaySha256(observed),
    replay_hash: replay ? replaySha256(replay) : null,
    status: divergence ? "DIVERGED" : "MATCHED",
    first_divergence: divergence,
    replay_verdict: replay ? (replayDivergence ? "REPRODUCED_DIFFERENCE" : "BASELINE_RESTORED") : "NOT_RUN",
    replay_first_divergence: replayDivergence
  };
  const record_hash = replaySha256(record);
  const authentication = secret
    ? { method: "HMAC-SHA256", value: crypto.createHmac("sha256", secret).update(record_hash).digest("hex") }
    : { method: "UNSIGNED", value: null };
  return { record, record_hash, authentication };
}

export function verifyCausalReplayReceipt(packet, secret) {
  const hash_valid = replaySha256(packet.record) === packet.record_hash;
  const auth_valid = packet.authentication?.method === "HMAC-SHA256" && secret
    ? crypto.timingSafeEqual(
        Buffer.from(packet.authentication.value, "hex"),
        Buffer.from(crypto.createHmac("sha256", secret).update(packet.record_hash).digest("hex"), "hex")
      )
    : packet.authentication?.method === "UNSIGNED";
  return { valid: hash_valid && auth_valid, hash_valid, auth_valid };
}
