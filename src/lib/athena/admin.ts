import { createHash, timingSafeEqual } from "node:crypto";
export function isAthenaAdmin(req: Request): boolean {
  const expected = process.env.ATHENA_ADMIN_TOKEN;
  const supplied = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!expected || !supplied) return false;
  const a = createHash("sha256").update(expected).digest();
  const b = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(a, b);
}
