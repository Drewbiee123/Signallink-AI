import crypto from "node:crypto";

function privateKey(): crypto.KeyObject {
  const pem = process.env.SIGNALINK_PRIVATE_KEY;
  if (pem) return crypto.createPrivateKey(pem.replace(/\\n/g, "\n"));
  const secret = process.env.SIGNALINK_HMAC_KEY;
  if (!secret) throw new Error("Server signing key is not configured");
  throw new Error("HMAC_MODE");
}

export function signString(message: string): string {
  try {
    return crypto.sign(null, Buffer.from(message), privateKey()).toString("base64");
  } catch (error) {
    if (error instanceof Error && error.message === "HMAC_MODE") {
      return `hmac-sha256:${crypto.createHmac("sha256", process.env.SIGNALINK_HMAC_KEY!).update(message).digest("base64")}`;
    }
    throw error;
  }
}
