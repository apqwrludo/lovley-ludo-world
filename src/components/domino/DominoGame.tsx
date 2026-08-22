import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Crown, Home, Layers, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/audio";
import {
  createDomino,
  currentDominoPlayer,
  drawTile,
  legalPlays,
  passTurn,
  pickDominoMove,
  playTile,
  tilesLeft,
  type DominoMove,
  type DominoState,
  type PlacedTile,
  type Tile,
} from "@/lib/domino/engine";
import { cn } from "@/lib/utils";
import modeDomino from "@/assets/mode-domino.png";
import avatarTiger from "@/assets/avatar-tiger.png";

const PIP_POSITIONS: Record<number, [number, number][]> = {
  0: [],
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [26, 26],
    [50, 50],
    [74, 74],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
};

function Half({ value }: { value: number }) {
  return (
    <span className="domino-half">
      {(PIP_POSITIONS[value] ?? []).map(([x, y], i) => (
        <i key={i} style={{ left: `${x}%`, top: `${y}%` }} />
      ))}
    </span>
  );
}

function DominoTile({
  a,
  b,
  horizontal,
  selectable,
  selected,
  onClick,
}: {
  a: number;
  b: number;
  horizontal?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <Half value={a} />
      <span className="domino-divider" />
      <Half value={b} />
    </>
  );
  if (!onClick) {
    return (
      <span className={cn("domino-tile", horizontal && "domino-horizontal")} aria-hidden="true">
        {content}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "domino-tile",
        horizontal && "domino-horizontal",
        selectable && "domino-playable",
        selected && "domino-selected",
      )}
      aria-label={`حجرة ${a} و ${b}`}
    >
      {content}
    </button>
  );
}

export function DominoGame({
  playerCount,
  humanCount,
  muted,
  onMute,
  onHome,
  onFinish,
}: {
  playerCount: 2 | 3 | 4;
  humanCount: number;
  muted: boolean;
  onMute: () => void;
  onHome: () => void;
  onFinish: (payload: { winnerSeat: number; mySeat: number; players: number; moves: number }) => void;
}) {
  const [state, setState] = useState<DominoState>(() => createDomino(playerCount, humanCount));
  const [selected, setSelected] = useState<string | null>(null);
  const moveCount = useRef(0);
  const reported = useRef(false);
  const railRef = useRef<HTMLElement>(null);

  const player = currentDominoPlayer(state);
  const myMoves = useMemo(() => (player.isBot ? [] : legalPlays(state)), [state, player.isBot]);
  const playableIds = useMemo(() => new Set(myMoves.map((m) => m.tileId)), [myMoves]);
  const mySeat = state.players.find((p) => !p.isBot)?.seat ?? 0;
  const me = state.players.find((p) => p.seat === mySeat);

  const commit = (move: DominoMove) => {
    moveCount.current += 1;
    sfx.move();
    setSelected(null);
    setState((s) => playTile(s, move));
  };

  const handleTileClick = (tile: Tile) => {
    const options = myMoves.filter((m) => m.tileId === tile.id);
    if (!options.length) return;
    if (options.length === 1) {
      commit(options[0]!);
      return;
    }
    setSelected((prev) => (prev === tile.id ? null : tile.id));
  };

  const playSide = (side: "left" | "right") => {
    if (!selected) return;
    const move = myMoves.find((m) => m.tileId === selected && m.side === side);
    if (move) commit(move);
  };

  // دور الروبوت
  useEffect(() => {
    if (state.phase === "over" || !player.isBot) return;
    const timer = window.setTimeout(() => {
      const options = legalPlays(state);
      if (options.length) {
        moveCount.current += 1;
        sfx.move();
        setState((s) => playTile(s, pickDominoMove(options, s)));
      } else if (state.stock.length) {
        moveCount.current += 1;
        sfx.tap();
        setState((s) => drawTile(s));
      } else {
        setState((s) => passTurn(s));
      }
    }, 750);
    return () => window.clearTimeout(timer);
  }, [state, player.isBot]);

  // نهاية المباراة
  useEffect(() => {
    if (state.phase !== "over" || state.winner === null || reported.current) return;
    reported.current = true;
    sfx.win();
    onFinish({
      winnerSeat: state.winner,
      mySeat,
      players: state.players.length,
      moves: moveCount.current,
    });
  }, [state.phase, state.winner, state.players.length, mySeat, onFinish]);

  /** تصغير تلقائي لسلسلة الحجارة كي تبقى متمركزة وواضحة دون تضييق على بعضها */
  const boardScale = useMemo(() => {
    const n = state.board.length;
    if (n <= 6) return 1;
    if (n <= 10) return 0.88;
    if (n <= 16) return 0.76;
    if (n <= 22) return 0.64;
    return 0.54;
  }, [state.board.length]);

  const restart = () => {
    moveCount.current = 0;
    reported.current = false;
    setSelected(null);
    sfx.start();
    setState(createDomino(playerCount, humanCount));
  };

  const noMove = !player.isBot && myMoves.length === 0 && state.phase === "play";

  return (
    <div className="ludo-shell min-h-screen" dir="rtl">
      <div className="crown-pattern fixed inset-0" aria-hidden="true" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-3 pb-5 pt-3">
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <Button variant="neonIcon" size="icon" aria-label="الرئيسية" onClick={onHome}>
            <Home />
          </Button>
          <div className="text-center">
            <img src={modeDomino} alt="" width={512} height={512} className="asset-shine mx-auto size-9" />
            <h1 className="font-display text-xl font-black text-ludo-gold text-shadow-glow">دومينو عبقور</h1>
            <p className="text-xs text-ludo-soft">
              المخزون: {state.stock.length} حجرة
            </p>
          </div>
          <Button variant="neonIcon" size="icon" aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"} onClick={onMute}>
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
        </header>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {state.players.map((p) => (
            <div
              key={p.seat}
              className={cn("ledger-row gap-2 p-2", state.turn === p.seat && "ring-2 ring-ludo-gold")}
            >
              {p.isBot ? (
                <span className="avatar-orb bg-ludo-purple text-ludo-gold"><Bot /></span>
              ) : (
                <img src={avatarTiger} alt="" width={512} height={512} loading="lazy" className="size-9 rounded-full ring-2 ring-ludo-gold" />
              )}
              <span className="min-w-0 flex-1">
                <b className="block truncate text-xs">{p.name}</b>
                <small className="flex items-center gap-1 text-ludo-soft">
                  <Layers className="size-3.5" /> {tilesLeft(state, p.seat)} حجارة
                </small>
              </span>
            </div>
          ))}
        </div>

        <section
          className="domino-arena my-2"
          ref={railRef}
          style={{ minHeight: `${Math.min(58, 40 + state.board.length * 0.7)}vh` }}
        >
          {state.board.length === 0 ? (
            <p className="text-center text-sm text-ludo-soft">
              ابدأ بوضع أي حجرة في منتصف الساحة
            </p>
          ) : (
            <div className="domino-chain" style={{ transform: `scale(${boardScale})` }}>
              {state.board.map((placed: PlacedTile) => (
                <DominoTile
                  key={placed.tile.id}
                  a={placed.left}
                  b={placed.right}
                  horizontal={placed.left !== placed.right}
                />
              ))}
            </div>
          )}
        </section>

        <p className="ledger-row justify-center text-center text-sm font-bold text-ludo-gold">{state.message}</p>

        {selected && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="royal" onClick={() => playSide("left")}>
              ضع في الطرف الأيسر
            </Button>
            <Button variant="royal" onClick={() => playSide("right")}>
              ضع في الطرف الأيمن
            </Button>
          </div>
        )}

        {noMove && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button
              variant="neon"
              disabled={!state.stock.length}
              onClick={() => {
                moveCount.current += 1;
                sfx.tap();
                setState((s) => drawTile(s));
              }}
            >
              اسحب حجرة
            </Button>
            <Button variant="neon" onClick={() => setState((s) => passTurn(s))}>
              مرّر الدور
            </Button>
          </div>
        )}

        <section className="mt-auto pt-4">
          <h2 className="ribbon-title mb-3">حجارتك</h2>
          <div className="flex flex-wrap justify-center gap-2 rounded-2xl border border-ludo-gold/35 bg-ludo-panel/55 p-2">
            {(me?.hand ?? []).map((tile) => (
              <DominoTile
                key={tile.id}
                a={tile.a}
                b={tile.b}
                selectable={playableIds.has(tile.id)}
                selected={selected === tile.id}
                onClick={() => handleTileClick(tile)}
              />
            ))}
          </div>
        </section>

        {state.phase === "over" && (
          <div className="fixed inset-0 z-[70] grid place-items-center bg-ludo-deep/85 p-5 backdrop-blur-sm">
            <div className="royal-panel celebrate-pop w-full max-w-sm p-6 text-center">
              <Crown className="mx-auto size-20 text-ludo-gold" fill="currentColor" />
              <h2 className="title-ribbon text-2xl">
                {state.winner === mySeat ? "مبروك الفوز!" : "حظًا أوفر"}
              </h2>
              <p className="my-4 text-sm text-ludo-soft">{state.message}</p>
              <Button variant="play" size="xl" className="w-full" onClick={restart}>
                <RotateCcw /> جولة جديدة
              </Button>
              <Button variant="ghostGold" className="mt-2 w-full" onClick={onHome}>
                العودة للرئيسية
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
