import process from "node:process";

const baseUrl = (process.argv[2] || process.env.SIGNALLINK_BASE_URL || "").replace(/\/$/, "");
const protectionBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "";
const attempts = 6;

if (!baseUrl) throw new Error("A production URL is required as the first argument or SIGNALLINK_BASE_URL");

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, expectation) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: {
          "cache-control": "no-cache",
          "user-agent": "SignalLink-Release-Guard/1.0",
          ...(protectionBypass ? { "x-vercel-protection-bypass": protectionBypass } : {})
        },
        signal: AbortSignal.timeout(10_000)
      });
      const body = await response.text();
      if (response.ok) {
        await expectation(body, response);
        return;
      }
      if (response.status < 500) throw new Error(`${path} returned non-retryable HTTP ${response.status}: ${body.slice(0, 300)}`);
      lastError = new Error(`${path} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (/non-retryable/.test(error.message)) throw error;
    }
    if (attempt < attempts) await wait(2 ** (attempt - 1) * 1000);
  }
  throw new Error(`${path} failed after ${attempts} attempts: ${lastError?.message}`);
}

await request("/", async (body) => {
  if (!body.toLowerCase().includes("signallink")) throw new Error("Home page did not contain the SignalLink identity marker");
});

await request("/services", async (body) => {
  if (!body.toLowerCase().includes("service")) throw new Error("Services page did not contain its expected marker");
});

await request("/api/health", async (body) => {
  let health;
  try { health = JSON.parse(body); } catch { throw new Error("Health endpoint returned non-JSON content"); }
  if (health.status !== "ok" || health.database !== "connected" || health.protocol !== "signing_configured" || health.payments !== "configured") {
    throw new Error(`Production health is not fully ready: ${JSON.stringify(health)}`);
  }
});

console.log(JSON.stringify({
  status: "LIVE_RELEASE_VERIFIED",
  base_url: baseUrl,
  attempts_allowed: attempts,
  boundaries: ["home", "services", "health", "database", "signing", "payments"]
}, null, 2));
