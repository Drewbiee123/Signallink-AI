import { createHmac, timingSafeEqual } from "node:crypto";
// The same server-side shared secret is sent in X-Hub-Secret on Subscription
// creation; athenahealth signs the unmodified delivery bytes with HMAC-SHA256.
export function signatureReady(): boolean { return !!process.env.ATHENA_WEBHOOK_SIGNING_SECRET; }
export async function verifyAthenaSignature(body: Uint8Array, headers: Headers): Promise<boolean> {
  const secret = process.env.ATHENA_WEBHOOK_SIGNING_SECRET;
  const signature = headers.get("x-hub-signature");
  if (!secret || !signature || !/^sha256=[0-9a-f]{64}$/i.test(signature)) return false;
  const actual = Buffer.from(signature.slice(7), "hex");
  const expected = createHmac("sha256", secret).update(body).digest();
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
