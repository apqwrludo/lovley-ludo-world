import { createServerFn } from "@tanstack/react-start";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ServerRoll = {
  value: number;
  seq: number;
  at: number;
  sig: string;
};

export type ServerTurn = {
  serverNow: number;
  deadline: number;
  limitMs: number;
  turn: number;
  sig: string;
};

/**
 * رمية نرد موثوقة: القيمة تُولّد داخل السيرفر بمولّد عشوائي آمن
 * وتُوقَّع رقميًا مع رقم الرمية ومعرّف المباراة حتى لا يمكن تعديلها من العميل.
 */
export const rollServerDie = createServerFn({ method: "POST" })
  .inputValidator((input: { matchId: string; seq: number }) => {
    if (!input || !UUID_RE.test(input.matchId)) throw new Error("invalid match id");
    const seq = Math.round(Number(input.seq));
    if (!Number.isFinite(seq) || seq < 0 || seq > 100_000) throw new Error("invalid seq");
    return { matchId: input.matchId, seq };
  })
  .handler(async ({ data }): Promise<ServerRoll> => {
    const { secureDie, signPayload } = await import("./live.server");
    const value = secureDie();
    const at = Date.now();
    return {
      value,
      seq: data.seq,
      at,
      sig: signPayload(["roll", data.matchId, data.seq, value, at]),
    };
  });

/**
 * بداية دور جديدة بتوقيت السيرفر: مهلة 15 ثانية موقّعة رقميًا،
 * فيُحسب المؤقت على ساعة السيرفر لا على ساعة الجهاز.
 */
export const startServerTurn = createServerFn({ method: "POST" })
  .inputValidator((input: { matchId: string; turn: number }) => {
    if (!input || !UUID_RE.test(input.matchId)) throw new Error("invalid match id");
    const turn = Math.round(Number(input.turn));
    if (!Number.isFinite(turn) || turn < 0 || turn > 100_000) throw new Error("invalid turn");
    return { matchId: input.matchId, turn };
  })
  .handler(async ({ data }): Promise<ServerTurn> => {
    const { signPayload, TURN_LIMIT_MS } = await import("./live.server");
    const serverNow = Date.now();
    const deadline = serverNow + TURN_LIMIT_MS;
    return {
      serverNow,
      deadline,
      limitMs: TURN_LIMIT_MS,
      turn: data.turn,
      sig: signPayload(["turn", data.matchId, data.turn, deadline]),
    };
  });
