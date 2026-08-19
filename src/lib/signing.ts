import crypto from "node:crypto";

function normalizePem(value: string): string {
  return value.replace(/\\n/g, "\n");
}

function privateKey(): crypto.KeyObject {
  const pem = process.env.SIGNALINK_PRIVATE_KEY;
  if (pem) return crypto.createPrivateKey(normalizePem(pem));
  const secret = process.env.SIGNALINK_HMAC_KEY;
  if (!secret) throw new Error("Server signing key is not configured");
  throw new Error("HMAC_MODE");
}

function publicKey(): crypto.KeyObject | null {
  const explicit = process.env.SIGNALINK_PUBLIC_KEY;
  if (explicit) return crypto.createPublicKey(normalizePem(explicit));
  const privatePem = process.env.SIGNALINK_PRIVATE_KEY;
  if (privatePem) return crypto.createPublicKey(crypto.createPrivateKey(normalizePem(privatePem)));
  return null;
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && crypto.timingSafeEqual(a, b);
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

export function verifyString(message: string, signature: string): boolean {
  try {
    if (signature.startsWith("hmac-sha256:")) {
      const secret = process.env.SIGNALINK_HMAC_KEY;
      if (!secret) return false;
      const supplied = Buffer.from(signature.slice("hmac-sha256:".length), "base64");
      const expected = crypto.createHmac("sha256", secret).update(message).digest();
      return safeEqual(supplied, expected);
    }

    const key = publicKey();
    if (!key) return false;
    return crypto.verify(null, Buffer.from(message), key, Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
}
