import { cn } from "@/lib/utils";

const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
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
        "dice-3d group relative grid h-[4.6rem] w-[4.6rem] shrink-0 place-items-center transition-transform",
        disabled ? "opacity-70" : "hover:-translate-y-1 active:translate-y-1",
        rolling && "animate-dice-roll",
      )}
      style={{ ["--seat" as string]: `var(--ludo-${seatToken})` }}
    >
      <div className="grid h-11 w-11 grid-cols-3 grid-rows-3 gap-[4px]">
        {Array.from({ length: 9 }, (_, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const on = (PIPS[value ?? 1] ?? []).some(([r, c]) => r === row && c === col);
          return <span key={i} className={cn(on ? "dice-pip" : "opacity-0")} />;
        })}
      </div>
      {!disabled && !rolling && (
        <span className="absolute -bottom-5 whitespace-nowrap text-[10px] font-bold text-ludo-gold">اضغط للرمي</span>
      )}
    </button>
  );
}
