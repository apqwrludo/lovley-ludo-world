import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Mission = {
  code: string;
  title: string;
  description: string;
  period: "daily" | "weekly";
  goal: number;
  progress: number;
  reward_gold: number;
  reward_diamonds: number;
  reward_xp: number;
  claimed: boolean;
  claimable: boolean;
  resets_at: string | null;
};

export type Chest = {
  code: string;
  title: string;
  description: string;
  tier: number;
  cost_gold: number;
  cost_diamonds: number;
  cooldown_minutes: number;
  next_free_at: string | null;
};

export type ChestReward = {
  ok: boolean;
  reason: string;
  gold: number;
  diamonds: number;
  xp: number;
  item_kind: "avatar" | "banner" | "frame" | null;
  item_code: string | null;
  rarity: string | null;
  is_new: boolean;
  next_free_at: string | null;
};

/** المهام اليومية والأسبوعية للاعب الحالي مع التقدّم المحسوب في السيرفر */
export const fetchMissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_missions");
    if (error) return { ok: false as const, reason: error.message, missions: [] as Mission[] };
    return { ok: true as const, reason: "ok", missions: (data ?? []) as unknown as Mission[] };
  });

/** استلام مكافأة مهمة — التحقق من الإكمال ومنع الاستلام المزدوج يحدث داخل قاعدة البيانات */
export const claimMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => {
    const code = String(input?.code ?? "");
    if (!/^[a-z0-9_]{2,40}$/.test(code)) throw new Error("invalid mission code");
    return { code };
  })
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("claim_mission", { _code: data.code });
    if (error) return { ok: false as const, reason: error.message, gold: 0, diamonds: 0, xp: 0 };
    const row = (Array.isArray(rows) ? rows[0] : rows) as
      | { ok: boolean; reason: string; gold: number; diamonds: number; xp: number }
      | null;
    return {
      ok: Boolean(row?.ok),
      reason: row?.reason ?? "unknown",
      gold: row?.gold ?? 0,
      diamonds: row?.diamonds ?? 0,
      xp: row?.xp ?? 0,
    };
  });

/** حالة الصناديق (التكلفة ووقت الصندوق المجاني القادم) */
export const fetchChests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_chests");
    if (error) return { ok: false as const, reason: error.message, chests: [] as Chest[] };
    return { ok: true as const, reason: "ok", chests: (data ?? []) as unknown as Chest[] };
  });

/** فتح صندوق: الخصم والاحتمالات والمكافأة كلها تُحسم في السيرفر وتُسجّل في سجل المعاملات */
export const openChest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => {
    const code = String(input?.code ?? "");
    if (!/^[a-z0-9_]{2,40}$/.test(code)) throw new Error("invalid chest code");
    return { code };
  })
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("open_chest", { _code: data.code });
    if (error) {
      return {
        ok: false,
        reason: error.message,
        gold: 0,
        diamonds: 0,
        xp: 0,
        item_kind: null,
        item_code: null,
        rarity: null,
        is_new: false,
        next_free_at: null,
      } satisfies ChestReward;
    }
    const row = (Array.isArray(rows) ? rows[0] : rows) as ChestReward | null;
    return (
      row ?? {
        ok: false,
        reason: "unknown",
        gold: 0,
        diamonds: 0,
        xp: 0,
        item_kind: null,
        item_code: null,
        rarity: null,
        is_new: false,
        next_free_at: null,
      }
    );
  });
