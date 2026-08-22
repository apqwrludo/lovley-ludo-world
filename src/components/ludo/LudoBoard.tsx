import { RING, SAFE_INDICES, SEATS, SEAT_ORDER, cellForOffset } from "@/lib/ludo/board";
import type { GameState, Move } from "@/lib/ludo/engine";
import { FINISH_OFFSET } from "@/lib/ludo/board";
import { cn } from "@/lib/utils";

const U = 100 / 15;

type Props = {
  state: GameState;
  moves: Move[];
  onTokenClick: (tokenId: string) => void;
};

const tokenClasses: Record<string, string> = {
  ruby: "bg-ludo-ruby",
  palm: "bg-ludo-palm",
  amber: "bg-ludo-amber",
  lagoon: "bg-ludo-lagoon",
};

const softClasses: Record<string, string> = {
  ruby: "bg-ludo-ruby/15",
  palm: "bg-ludo-palm/15",
  amber: "bg-ludo-amber/15",
  lagoon: "bg-ludo-lagoon/15",
};

export function LudoBoard({ state, moves, onTokenClick }: Props) {
  const movableIds = new Set(moves.map((m) => m.tokenId));
  const targets = new Map(moves.map((m) => [m.tokenId, m.to]));
  const activeSeats = new Set(state.players.map((p) => p.seat));

  // ترتيب القطع المتكدّسة على نفس الخانة
  const stackIndex = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const t of state.tokens) {
    const cell = t.offset < 0 ? `yard-${t.id}` : keyOf(t.seat, t.offset);
    const n = counts.get(cell) ?? 0;
    stackIndex.set(t.id, n);
    counts.set(cell, n + 1);
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[1.75rem] border border-ludo-line/60 bg-ludo-board shadow-[var(--shadow-board)]">
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-board)]" />

      {/* الأحواش */}
      {SEAT_ORDER.map((id) => {
        const seat = SEATS[id];
        const active = activeSeats.has(id);
        return (
          <div
            key={`yard-${id}`}
            className={cn(
              "absolute rounded-3xl border-2 p-[3%] transition-opacity",
              softClasses[seat.token],
              active ? "opacity-100" : "opacity-30",
            )}
            style={{
              left: `${seat.yardBox.x * U}%`,
              top: `${seat.yardBox.y * U}%`,
              width: `${6 * U}%`,
              height: `${6 * U}%`,
              borderColor: `var(--ludo-${seat.token})`,
            }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-ludo-surface/70">
              <span
                className="text-[clamp(0.5rem,1.6vw,0.8rem)] font-semibold tracking-wide"
                style={{ color: `var(--ludo-${seat.token})` }}
              >
                {seat.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* خانات المسار */}
      {RING.map((cell, i) => {
        const owner = SEAT_ORDER.find((id) => SEATS[id].start === i);
        const safe = SAFE_INDICES.has(i);
        return (
          <div
            key={`ring-${i}`}
            className={cn(
              "absolute rounded-[0.3rem] border border-ludo-line/70 bg-ludo-surface",
              owner !== undefined && softClasses[SEATS[owner].token],
            )}
            style={{
              left: `${cell.x * U}%`,
              top: `${cell.y * U}%`,
              width: `${U}%`,
              height: `${U}%`,
              ...(owner !== undefined
                ? { borderColor: `var(--ludo-${SEATS[owner].token})` }
                : null),
            }}
          >
            {safe && (
              <span className="absolute inset-0 flex items-center justify-center text-ludo-ink/35">
                <StarIcon />
              </span>
            )}
          </div>
        );
      })}

      {/* الممرات المنزلية */}
      {SEAT_ORDER.map((id) =>
        SEATS[id].home.slice(0, 5).map((cell, i) => (
          <div
            key={`home-${id}-${i}`}
            className={cn("absolute rounded-[0.3rem] border", softClasses[SEATS[id].token])}
            style={{
              left: `${cell.x * U}%`,
              top: `${cell.y * U}%`,
              width: `${U}%`,
              height: `${U}%`,
              borderColor: `var(--ludo-${SEATS[id].token})`,
              backgroundColor: `color-mix(in oklab, var(--ludo-${SEATS[id].token}) ${25 + i * 12}%, var(--ludo-surface))`,
            }}
          />
        )),
      )}

      {/* المركز */}
      <div
        className="absolute overflow-hidden rounded-[0.6rem] border border-ludo-line/70"
        style={{ left: `${6 * U}%`, top: `${6 * U}%`, width: `${3 * U}%`, height: `${3 * U}%` }}
      >
        <Triangle color="palm" dir="left" />
        <Triangle color="amber" dir="top" />
        <Triangle color="lagoon" dir="right" />
        <Triangle color="ruby" dir="bottom" />
      </div>

      {/* أهداف الحركة */}
      {moves.map((m) => {
        const token = state.tokens.find((t) => t.id === m.tokenId);
        if (!token) return null;
        const cell = cellForOffset(token.seat, m.to);
        return (
          <div
            key={`hint-${m.tokenId}`}
            className="pointer-events-none absolute animate-pulse rounded-full border-2 border-dashed border-ludo-gold/70"
            style={{ left: `${cell.x * U}%`, top: `${cell.y * U}%`, width: `${U}%`, height: `${U}%` }}
          />
        );
      })}

      {/* القطع */}
      {state.tokens.map((t) => {
        const seat = SEATS[t.seat];
        const stack = stackIndex.get(t.id) ?? 0;
        const yardIndex = Number(t.id.split("-")[1]);
        const cell = t.offset < 0 ? seat.yard[yardIndex] ?? seat.yard[0] : cellForOffset(t.seat, t.offset);
        if (!cell) return null;
        const jitter = t.offset < 0 ? 0 : stack * 0.16;
        const movable = movableIds.has(t.id);
        const finished = t.offset === FINISH_OFFSET;

        return (
          <button
            key={t.id}
            type="button"
            disabled={!movable}
            onClick={() => onTokenClick(t.id)}
            aria-label={`قطعة ${seat.label}`}
            className={cn("absolute grid place-items-center transition-[left,top] duration-300 ease-out", movable ? "z-20 cursor-pointer" : "z-10 cursor-default")}
            style={{ left: `${(cell.x + jitter) * U}%`, top: `${(cell.y - jitter) * U}%`, width: `${U}%`, height: `${U}%` }}
          >
            <span
              className={cn(
                "coin-token",
                movable && "animate-token-ready",
                finished && "scale-[.68]",
                state.lastMovedTokenId === t.id && "animate-token-pop",
              )}
              style={{ ["--seat" as string]: `var(--ludo-${seat.token})` }}
            >
              <CrownGlyph />
            </span>
            {targets.has(t.id) && <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-ludo-gold/60" />}
          </button>
        );
      })}
    </div>
  );
}

function keyOf(seat: number, offset: number) {
  const c = cellForOffset(seat as 0 | 1 | 2 | 3, offset);
  return `${c.x}:${c.y}`;
}

function Triangle({
  color,
  dir,
}: {
  color: "ruby" | "palm" | "amber" | "lagoon";
  dir: "top" | "bottom" | "left" | "right";
}) {
  const clip = {
    top: "polygon(0 0, 100% 0, 50% 50%)",
    bottom: "polygon(0 100%, 100% 100%, 50% 50%)",
    left: "polygon(0 0, 0 100%, 50% 50%)",
    right: "polygon(100% 0, 100% 100%, 50% 50%)",
  }[dir];
  return (
    <span
      className="absolute inset-0"
      style={{ background: `var(--ludo-${color})`, clipPath: clip }}
    />
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" aria-hidden="true">
      <path
        d="M12 3l2.2 5.6L20 9.4l-4 4.1 1 5.9-5-3-5 3 1-5.9-4-4.1 5.8-.8z"
        fill="currentColor"
      />
    </svg>
  );
}
