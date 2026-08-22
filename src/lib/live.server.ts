import { createHmac, randomInt } from "crypto";

/** التوقيع الرقمي للنتائج التي يولّدها السيرفر (نرد/مؤقت) */
export function signPayload(parts: (string | number)[]): string {
  const secret = process.env["ABQOR_MATCH_SECRET"] ?? "";
  return createHmac("sha256", secret).update(parts.join("|")).digest("hex").slice(0, 32);
}

/** نرد عشوائي آمن مولّد داخل السيرفر */
export function secureDie(): number {
  return randomInt(1, 7);
}

export const TURN_LIMIT_MS = 15_000;
