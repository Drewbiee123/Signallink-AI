import { createHash } from "crypto";

export function sha256hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}
