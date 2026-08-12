import crypto from "node:crypto";
export function sha256hex(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}
