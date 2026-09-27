import { getAthenaToken } from "./oauth";
export function athenaBase(): string {
  const preview = process.env.ATHENA_PREVIEW_FHIR_BASE_URL || "https://api.preview.platform.athenahealth.com/fhir/r4";
  const production = process.env.ATHENA_PRODUCTION_FHIR_BASE_URL || "https://api.platform.athenahealth.com/fhir/r4";
  const base = process.env.ATHENA_ENV === "production" ? production : preview;
  if (!base.startsWith("https://")) throw new Error("INVALID_FHIR_BASE");
  return base.replace(/\/$/, "");
}
export async function athenaRequest(path: string, init: RequestInit = {}) {
  if (!/^\/?(?:SubscriptionTopic|Subscription)(?:\/[A-Za-z0-9._-]+)?$/.test(path)) throw new Error("INVALID_FHIR_PATH");
  const token = await getAthenaToken();
  const response = await fetch(`${athenaBase()}/${path.replace(/^\//, "")}`, {
    ...init, headers: { Accept: "application/fhir+json", "Content-Type": "application/fhir+json", ...init.headers, Authorization: `Bearer ${token}` },
    cache: "no-store", signal: AbortSignal.timeout(7000)
  });
  if (!response.ok) throw new Error("ATHENA_API_FAILURE");
  return response.status === 204 ? null : response.json();
}
