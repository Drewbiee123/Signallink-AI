import crypto from "node:crypto";

export function validScannerToken(token: unknown): token is string {
  return typeof token === "string" && /^[a-f0-9]{64}$/.test(token);
}

export function scannerTokenHash(token: string): string {
  return crypto.createHash("sha256").update(`signallink.scanner.v1:${token}`).digest("hex");
}

export function scannerBillingEnabled(): boolean {
  return process.env.SIGNALINK_SCANNER_BILLING_ENABLED === "true";
}
