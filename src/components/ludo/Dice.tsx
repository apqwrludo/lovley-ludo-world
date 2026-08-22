import { cn } from "@/lib/utils";

const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

type Props = {
  value: number | null;
  rolling: boolean;
  disabled: boolean;
  onRoll: () => void;
  seatToken: string;
};

export function Dice({ value, rolling, disabled, onRoll, seatToken }: Props) {
  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={disabled}
      aria-label="ارمِ النرد"
      className={cn(
        "group relative grid h-20 w-20 place-items-center rounded-2xl border-2 bg-ludo-surface shadow-[var(--shadow-token)] transition-all",
        disabled ? "opacity-60" : "hover:-translate-y-0.5 active:scale-95",
        rolling && "animate-dice-roll",
      )}
      style={{ borderColor: `var(--ludo-${seatToken})` }}
    >
      <div className="grid h-12 w-12 grid-cols-3 grid-rows-3 gap-[3px]">
        {Array.from({ length: 9 }, (_, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const on = (PIPS[value ?? 1] ?? []).some(([r, c]) => r === row && c === col);
          return (
            <span
              key={i}
              className={cn(
                "rounded-full transition-opacity",
                on ? "bg-ludo-ink" : "bg-transparent",
              )}
            />
          );
        })}
      </div>
      {!disabled && !rolling && (
        <span className="absolute -bottom-6 text-xs font-medium text-ludo-ink/70">اضغط للرمي</span>
      )}
    </button>
  );
}
