import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Coins, Gem, Loader2, Sparkles, Target } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { claimMission, fetchMissions, type Mission } from "@/lib/economy.functions";
import { sfx } from "@/lib/audio";
import { cn } from "@/lib/utils";

const REASONS: Record<string, string> = {
  not_claimable: "المهمة غير مكتملة أو تم استلامها مسبقًا",
  unknown_mission: "هذه المهمة غير متاحة الآن",
};

function resetLabel(iso: string | null) {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "يتجدد الآن";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `يتجدد بعد ${Math.floor(hours / 24)} يوم`;
  if (hours >= 1) return `يتجدد بعد ${hours} ساعة`;
  return `يتجدد بعد ${Math.max(1, Math.round(ms / 60_000))} دقيقة`;
}

export function MissionsPanel({
  signedIn,
  onWalletChange,
}: {
  signedIn: boolean;
  onWalletChange: () => void;
}) {
  const load = useServerFn(fetchMissions);
  const claim = useServerFn(claimMission);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!signedIn) {
      setMissions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await load({});
      setMissions(res.missions ?? []);
    } finally {
      setLoading(false);
    }
  }, [load, signedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onClaim = async (code: string) => {
    setBusy(code);
    setNote(null);
    try {
      const res = await claim({ data: { code } });
      if (res.ok) {
        sfx.home();
        setNote(`تم الاستلام: ${res.gold} ذهب${res.diamonds ? ` و ${res.diamonds} جوهرة` : ""} و ${res.xp} خبرة`);
        onWalletChange();
      } else {
        setNote(REASONS[res.reason] ?? "لم يتم الاستلام، حاول لاحقًا");
      }
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  if (!signedIn) {
    return (
      <p className="rounded-xl border border-ludo-gold/35 bg-ludo-panel/70 p-5 text-center text-sm text-ludo-soft">
        سجّل الدخول لتتبّع مهامك اليومية والأسبوعية واستلام مكافآتها.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-10 text-ludo-gold">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  const groups: [string, "daily" | "weekly", string][] = [
    ["مهام اليوم", "daily", "تتصفّر كل يوم"],
    ["مهام الأسبوع", "weekly", "تتصفّر كل أسبوع"],
  ];

  return (
    <div className="space-y-4">
      {note && (
        <p className="rounded-lg border border-ludo-gold/50 bg-ludo-purple/50 p-2 text-center text-xs text-ludo-gold">
          {note}
        </p>
      )}
      {groups.map(([title, period, hint]) => {
        const items = missions.filter((m) => m.period === period);
        if (!items.length) return null;
        return (
          <section key={period}>
            <header className="mb-2 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-bold text-ludo-gold">
                {period === "daily" ? <Target className="size-5" /> : <Sparkles className="size-5" />}
                {title}
              </h3>
              <small className="flex items-center gap-1 text-ludo-soft">
                <CalendarClock className="size-4" />
                {resetLabel(items[0]?.resets_at ?? null) || hint}
              </small>
            </header>
            <div className="space-y-2">
              {items.map((m) => {
                const pct = Math.min(100, Math.round((m.progress / m.goal) * 100));
                return (
                  <article
                    key={m.code}
                    className={cn(
                      "rounded-xl border border-ludo-gold/35 bg-ludo-panel/70 p-3",
                      m.claimed && "opacity-70",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <b className="block text-sm text-ludo-gold">{m.title}</b>
                        <small className="text-ludo-soft">{m.description}</small>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 text-ludo-gold">
                          <Coins className="size-4" /> {m.reward_gold}
                        </span>
                        {m.reward_diamonds > 0 && (
                          <span className="flex items-center gap-1 text-ludo-lagoon">
                            <Gem className="size-4" /> {m.reward_diamonds}
                          </span>
                        )}
                        <span className="text-ludo-pink">+{m.reward_xp} XP</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ludo-deep">
                        <span
                          className="block h-full rounded-full bg-gradient-to-l from-ludo-gold to-ludo-pink transition-[width] duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <small className="shrink-0 tabular-nums text-ludo-soft">
                        {m.progress}/{m.goal}
                      </small>
                      {m.claimed ? (
                        <span className="flex shrink-0 items-center gap-1 text-xs text-ludo-palm">
                          <CheckCircle2 className="size-4" /> مستلمة
                        </span>
                      ) : (
                        <Button
                          variant={m.claimable ? "play" : "neon"}
                          size="sm"
                          disabled={!m.claimable || busy === m.code}
                          onClick={() => void onClaim(m.code)}
                        >
                          {busy === m.code ? <Loader2 className="size-4 animate-spin" /> : "استلم"}
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
