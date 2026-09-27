let cache: { token: string; expires: number } | null = null;
export async function getAthenaToken(): Promise<string> {
  if (cache && Date.now() < cache.expires) return cache.token;
  const { ATHENA_CLIENT_ID: id, ATHENA_CLIENT_SECRET: secret } = process.env;
  const url = process.env.ATHENA_TOKEN_URL || (process.env.ATHENA_ENV === "production"
    ? "https://api.platform.athenahealth.com/oauth2/v1/token"
    : "https://api.preview.platform.athenahealth.com/oauth2/v1/token");
  if (!id || !secret || !url || !url.startsWith("https://")) throw new Error("OAUTH_NOT_CONFIGURED");
  const res = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` },
    body: new URLSearchParams({ grant_type: "client_credentials",
      scope: "system/SubscriptionTopic.read system/Subscription.write system/Subscription.read" }),
    cache: "no-store", signal: AbortSignal.timeout(7000)
  });
  if (!res.ok) throw new Error("OAUTH_FAILED");
  const data = await res.json();
  if (typeof data.access_token !== "string" || !Number.isFinite(Number(data.expires_in))) throw new Error("OAUTH_INVALID_RESPONSE");
  cache = { token: data.access_token, expires: Date.now() + Math.max(0, Number(data.expires_in) - 60) * 1000 };
  return cache.token;
}
