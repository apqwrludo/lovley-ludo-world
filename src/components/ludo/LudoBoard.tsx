import { SEATS, cellForOffset, FINISH_OFFSET } from "@/lib/ludo/board";
import type { GameState, Move } from "@/lib/ludo/engine";
import { cn } from "@/lib/utils";
import boardAsset from "@/assets/ludo-board.png.asset.json";

const U = 100 / 15;

type Props = {
  state: GameState;
  moves: Move[];
  onTokenClick: (tokenId: string) => void;
};

function CrownGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-[52%] w-[52%]" aria-hidden="true" fill="currentColor">
      <path d="M3 8.2l4.1 3L12 4.8l4.9 6.4 4.1-3L19 19H5L3 8.2zM5.6 20.4h12.8v1.8H5.6v-1.8z" />
    </svg>
  );
}

/** مركز الخانة بإحداثيات الشبكة (15×15) */
function centerFor(seat: 0 | 1 | 2 | 3, offset: number, yardIndex: number) {
  if (offset < 0) {
    const slot = SEATS[seat].yard[yardIndex] ?? SEATS[seat].yard[0];
    return slot ?? { x: 7.5, y: 7.5 };
  }
  const cell = cellForOffset(seat, offset);
  return { x: cell.x + 0.5, y: cell.y + 0.5 };
}

export function LudoBoard({ state, moves, onTokenClick }: Props) {
  const movableIds = new Set(moves.map((m) => m.tokenId));
  const targets = new Map(moves.map((m) => [m.tokenId, m.to]));

  // ترتيب القطع المتكدّسة على نفس الخانة
  const stackIndex = new Map<string, number>();
  const counts = new Map<string, number>();
  const cellKeys = new Map<string, string>();
  for (const t of state.tokens) {
    const cell = t.offset < 0 ? `yard-${t.id}` : keyOf(t.seat, t.offset);
    cellKeys.set(t.id, cell);
    const n = counts.get(cell) ?? 0;
    stackIndex.set(t.id, n);
    counts.set(cell, n + 1);
  }

  return (
    <div className="relative aspect-square w-full select-none">
      <img
        src={boardAsset.url}
        alt="لوحة اللودو"
        className="pointer-events-none absolute inset-0 h-full w-full rounded-[0.35rem]"
        draggable={false}
      />

      {/* أهداف الحركة */}
      {moves.map((m) => {
        const token = state.tokens.find((t) => t.id === m.tokenId);
        if (!token) return null;
        const c = centerFor(token.seat, m.to, Number(token.id.split("-")[1]));
        return (
          <div
            key={`hint-${m.tokenId}`}
            className="pointer-events-none absolute animate-pulse rounded-full border-2 border-dashed border-ludo-gold"
            style={{
              left: `${c.x * U}%`,
              top: `${c.y * U}%`,
              width: `${U}%`,
              height: `${U}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}

      {/* القطع */}
      {state.tokens.map((t) => {
        const seat = SEATS[t.seat];
        const stack = stackIndex.get(t.id) ?? 0;
        const yardIndex = Number(t.id.split("-")[1]);
        const c = centerFor(t.seat, t.offset, yardIndex);
        const total = counts.get(cellKeys.get(t.id) ?? "") ?? 1;
        // إزاحة متناظرة حول مركز الخانة حتى تبقى المجموعة متمركزة تمامًا
        const spread = t.offset < 0 || total < 2 ? 0 : 0.17;
        const shift = spread === 0 ? 0 : (stack - (total - 1) / 2) * spread;
        const size = total > 1 ? U * 0.86 : U * 1.02;
        const movable = movableIds.has(t.id);
        const finished = t.offset === FINISH_OFFSET;

        return (
          <button
            key={t.id}
            type="button"
            disabled={!movable}
            onClick={() => onTokenClick(t.id)}
            aria-label={`قطعة ${seat.label}`}
            className={cn(
              "absolute grid place-items-center transition-[left,top] duration-300 ease-out",
              movable ? "z-20 cursor-pointer" : "z-10 cursor-default",
            )}
            style={{
              left: `${(c.x + shift) * U}%`,
              top: `${(c.y - shift * 0.5) * U}%`,
              width: `${size}%`,
              height: `${size}%`,
              transform: "translate(-50%, -50%)",
            }}
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
            {targets.has(t.id) && (
              <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-ludo-gold/60" />
            )}
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
