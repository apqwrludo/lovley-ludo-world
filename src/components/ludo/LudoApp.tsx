import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  ChevronLeft,
  Crown,
  Gift,
  Home,
  Medal,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dice } from "./Dice";
import { LudoBoard } from "./LudoBoard";
import {
  applyMove,
  applyRoll,
  createGame,
  currentPlayer,
  legalMoves,
  pickBotMove,
  rollDie,
  tokensDone,
  type GameState,
} from "@/lib/ludo/engine";
import { SEATS } from "@/lib/ludo/board";
import { cn } from "@/lib/utils";

type Screen = "home" | "setup" | "rooms" | "rewards" | "tournaments" | "game";

const colorBg: Record<string, string> = {
  ruby: "bg-ludo-ruby",
  palm: "bg-ludo-palm",
  amber: "bg-ludo-amber",
  lagoon: "bg-ludo-lagoon",
};

export function LudoApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [humanCount, setHumanCount] = useState(1);
  const [game, setGame] = useState<GameState>(() => createGame(4, 1));
  const [rolling, setRolling] = useState(false);
  const [muted, setMuted] = useState(false);

  const moves = useMemo(
    () => (game.phase === "move" && game.dice ? legalMoves(game, game.dice) : []),
    [game],
  );
  const player = currentPlayer(game);
  const seat = SEATS[player.seat];

  const startGame = () => {
    setGame(createGame(playerCount, Math.min(humanCount, playerCount)));
    setScreen("game");
  };

  const handleRoll = () => {
    if (rolling || game.phase !== "roll") return;
    setRolling(true);
    window.setTimeout(() => {
      setGame((g) => applyRoll(g, rollDie()));
      setRolling(false);
    }, 560);
  };

  const handleToken = (id: string) => {
    const move = moves.find((item) => item.tokenId === id);
    if (move) setGame((g) => applyMove(g, move));
  };

  useEffect(() => {
    if (screen !== "game" || game.phase === "over" || !player.isBot || rolling) return;
    const timer = window.setTimeout(() => {
      if (game.phase === "roll") {
        setRolling(true);
        window.setTimeout(() => {
          setGame((g) => applyRoll(g, rollDie()));
          setRolling(false);
        }, 520);
      } else if (moves.length) {
        setGame((g) => applyMove(g, pickBotMove(moves)));
      }
    }, 720);
    return () => window.clearTimeout(timer);
  }, [screen, game.phase, game.turn, game.dice, game.winner, player.isBot, rolling, moves]);

  useEffect(() => {
    if (game.phase !== "move" || player.isBot || moves.length !== 1) return;
    const timer = window.setTimeout(() => setGame((g) => applyMove(g, moves[0])), 420);
    return () => window.clearTimeout(timer);
  }, [game.phase, game.turn, game.dice, player.isBot, moves]);

  if (screen === "game") {
    return (
      <GameScreen
        state={game}
        moves={moves}
        rolling={rolling}
        muted={muted}
        onMute={() => setMuted((v) => !v)}
        onRoll={handleRoll}
        onToken={handleToken}
        onHome={() => setScreen("home")}
        onRestart={startGame}
      />
    );
  }

  return (
    <div className="ludo-shell min-h-screen" dir="rtl">
      <Starfield />
      <div className="relative mx-auto min-h-screen w-full max-w-md px-3 pb-24 pt-3 sm:pt-5">
        <TopBar onMenu={() => setScreen("home")} />
        {screen === "home" && <HomeScreen navigate={setScreen} quickPlay={startGame} />}
        {screen === "setup" && (
          <SetupScreen
            players={playerCount}
            humans={humanCount}
            setPlayers={setPlayerCount}
            setHumans={setHumanCount}
            onStart={startGame}
            onBack={() => setScreen("home")}
          />
        )}
        {screen === "rooms" && <RoomsScreen onBack={() => setScreen("home")} onPlay={startGame} />}
        {screen === "rewards" && <RewardsScreen onBack={() => setScreen("home")} />}
        {screen === "tournaments" && <TournamentsScreen onBack={() => setScreen("home")} />}
        <BottomNav active={screen} navigate={setScreen} />
      </div>
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
      <Button variant="neonIcon" size="icon" aria-label="القائمة" onClick={onMenu}><Menu /></Button>
      <Brand />
      <div className="coin-pill"><span>🪙</span><b>892</b><Plus className="size-4" /></div>
    </header>
  );
}

function Brand() {
  return (
    <div className="min-w-0 text-center">
      <Crown className="mx-auto -mb-1 size-8 text-ludo-gold drop-shadow-[0_0_8px_var(--ludo-gold)]" fill="currentColor" />
      <h1 className="truncate font-display text-2xl font-black text-ludo-gold text-shadow-glow">ABQOR LUDO</h1>
      <p className="-mt-1 text-xs font-bold text-ludo-pink">عبقور لودو</p>
    </div>
  );
}

function HomeScreen({ navigate, quickPlay }: { navigate: (s: Screen) => void; quickPlay: () => void }) {
  return (
    <main className="mt-4 space-y-4">
      <section className="royal-panel relative overflow-hidden p-5 text-center">
        <div className="absolute inset-x-8 top-4 h-28 rounded-full bg-ludo-pink/15 blur-3xl" />
        <div className="relative mx-auto mb-2 grid size-32 place-items-center">
          <div className="absolute inset-2 rotate-45 rounded-3xl border-2 border-ludo-gold/70 bg-ludo-purple shadow-[0_0_24px_var(--ludo-pink)]" />
          <Crown className="relative size-20 text-ludo-gold" fill="currentColor" />
          <Sparkles className="absolute left-0 top-2 size-7 text-ludo-pink" />
          <Sparkles className="absolute bottom-2 right-0 size-6 text-ludo-gold" />
        </div>
        <h2 className="title-ribbon">مملكة الحظ تبدأ هنا</h2>
        <p className="mt-3 text-sm text-ludo-soft">اجمع أصدقاءك، حرّك نجومك، وكن أول من يصل إلى العرش</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <ModeCard color="palm" icon={<Bot />} title="لعب سريع" subtitle="ضد الروبوت" onClick={quickPlay} />
        <ModeCard color="amber" icon={<Users />} title="لعب محلي" subtitle="2 – 4 لاعبين" onClick={() => navigate("setup")} />
        <ModeCard color="ruby" icon={<Trophy />} title="البطولات" subtitle="جوائز ملكية" onClick={() => navigate("tournaments")} />
        <ModeCard color="lagoon" icon={<Medal />} title="الغرف" subtitle="تحديات قادمة" onClick={() => navigate("rooms")} />
      </div>

      <button className="reward-banner" type="button" onClick={() => navigate("rewards")}>
        <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-ludo-pink/20"><Gift className="size-9 text-ludo-gold" /></span>
        <span className="min-w-0 text-right"><b className="block text-lg text-ludo-gold">هدية اليوم جاهزة!</b><small className="text-ludo-soft">افتح الصندوق واجمع العملات</small></span>
        <ChevronLeft className="size-6 shrink-0 text-ludo-gold" />
      </button>
    </main>
  );
}

function ModeCard({ color, icon, title, subtitle, onClick }: { color: string; icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="game-tile group" style={{ "--tile": `var(--ludo-${color})` } as React.CSSProperties}>
      <span className="game-tile-icon">{icon}</span><b>{title}</b><small>{subtitle}</small>
    </button>
  );
}

function SetupScreen({ players, humans, setPlayers, setHumans, onStart, onBack }: { players: 2 | 3 | 4; humans: number; setPlayers: (v: 2 | 3 | 4) => void; setHumans: (v: number) => void; onStart: () => void; onBack: () => void }) {
  return (
    <PanelPage title="تجهيز الطاولة" icon={<Users />} onBack={onBack}>
      <p className="mb-3 text-center text-sm text-ludo-soft">اختر عدد المشاركين واللاعبين الحقيقيين</p>
      <SettingBlock title="عدد اللاعبين">
        <div className="grid grid-cols-3 gap-2">{([2,3,4] as const).map((n) => <Button key={n} variant={players === n ? "royal" : "neon"} onClick={() => { setPlayers(n); setHumans(Math.min(humans,n)); }}>{n} لاعبين</Button>)}</div>
      </SettingBlock>
      <SettingBlock title="اللاعبون المحليون">
        <div className="grid grid-cols-4 gap-2">{[1,2,3,4].filter(n => n <= players).map((n) => <Button key={n} variant={humans === n ? "royal" : "neon"} onClick={() => setHumans(n)}>{n}</Button>)}</div>
        <p className="mt-3 text-xs text-ludo-soft">سيكمل الروبوت المقاعد المتبقية تلقائيًا</p>
      </SettingBlock>
      <Button variant="play" size="xl" className="mt-5 w-full" onClick={onStart}>ابدأ اللعبة <Crown /></Button>
    </PanelPage>
  );
}

function RoomsScreen({ onBack, onPlay }: { onBack: () => void; onPlay: () => void }) {
  const rooms = ["غرفة المرح", "أصدقاء عبقور", "تحدّي الأبطال", "شوق اللعبة"];
  return <PanelPage title="الغرف المتاحة" icon={<Users />} onBack={onBack}><div className="space-y-2">{rooms.map((name,i) => <div className="list-card" key={name}><span className="avatar-orb">{i+1}</span><span className="min-w-0 flex-1"><b className="block truncate">{name}</b><small className="text-ludo-soft">{i%2 ? "2 / 4" : "3 / 4"} لاعبين</small></span><Button variant="play" size="sm" onClick={onPlay}>انضم</Button></div>)}</div><Button variant="royal" className="mt-4 w-full"><Plus /> إنشاء غرفة</Button></PanelPage>;
}

function RewardsScreen({ onBack }: { onBack: () => void }) {
  const items = [["🪙","1000 عملة"],["🎁","صندوق ملكي"],["👑","تاج الملك"],["💎","100 جوهرة"]];
  return <PanelPage title="المكافآت" icon={<Gift />} onBack={onBack}><div className="reward-hero"><Gift className="size-20 text-ludo-gold"/><b>هدية يومية مميزة</b><span>عد غدًا لمفاجأة جديدة</span></div><div className="mt-3 grid grid-cols-2 gap-3">{items.map(([icon,name],i) => <div className="reward-card" key={name}><span className="text-5xl">{icon}</span><b>{name}</b><Button variant={i===0 ? "play" : "neon"} size="sm">{i===0 ? "استلم" : "قريبًا"}</Button></div>)}</div></PanelPage>;
}

function TournamentsScreen({ onBack }: { onBack: () => void }) {
  return <PanelPage title="البطولات" icon={<Trophy />} onBack={onBack}><div className="trophy-stage"><Trophy className="size-24 text-ludo-gold" fill="currentColor"/><h3>بطولة عبقور الكبرى</h3><p>الجائزة الكبرى 20,000 عملة</p><div className="countdown"><span><b>05</b> أيام</span><span><b>12</b> ساعة</span><span><b>36</b> دقيقة</span></div></div>{["بطولة السرعة","تحدّي الأصدقاء","بطولة المحترفين"].map((x,i) => <div className="list-card mt-2" key={x}><Medal className="size-8 text-ludo-gold"/><span className="flex-1"><b className="block">{x}</b><small className="text-ludo-soft">{i+2} أيام متبقية</small></span><Button variant="neon" size="sm">التفاصيل</Button></div>)}</PanelPage>;
}

function PanelPage({ title, icon, onBack, children }: { title: string; icon: React.ReactNode; onBack: () => void; children: React.ReactNode }) {
  return <main className="royal-panel mt-4 p-3"><header className="title-ribbon mb-4 grid grid-cols-[auto_1fr_auto] items-center"><Button variant="ghostGold" size="icon" onClick={onBack}><ChevronLeft className="rotate-180"/></Button><h2 className="flex items-center justify-center gap-2 text-xl">{icon}{title}</h2><span className="size-9"/></header>{children}</main>;
}

function SettingBlock({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mb-3 rounded-xl border border-ludo-gold/35 bg-ludo-panel/70 p-3"><h3 className="mb-3 font-bold text-ludo-gold">{title}</h3>{children}</section>; }

function BottomNav({ active, navigate }: { active: Screen; navigate: (s: Screen) => void }) {
  const links: [Screen, React.ReactNode, string][] = [["home",<Home key="h"/>,"الرئيسية"],["rooms",<Users key="u"/>,"الغرف"],["tournaments",<Trophy key="t"/>,"البطولات"],["rewards",<Gift key="g"/>,"الهدايا"],["setup",<Settings key="s"/>,"اللعب"]];
  return <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-md grid-cols-5 border-t border-ludo-gold/60 bg-ludo-deep/95 px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">{links.map(([id,icon,label]) => <button type="button" key={id} onClick={() => navigate(id)} className={cn("grid place-items-center gap-0.5 text-[10px] text-ludo-soft",active===id&&"text-ludo-gold")}>{icon}<span>{label}</span></button>)}</nav>;
}

function GameScreen({ state, moves, rolling, muted, onMute, onRoll, onToken, onHome, onRestart }: { state: GameState; moves: ReturnType<typeof legalMoves>; rolling: boolean; muted: boolean; onMute: () => void; onRoll: () => void; onToken: (id:string) => void; onHome: () => void; onRestart: () => void }) {
  const player = currentPlayer(state); const seat = SEATS[player.seat];
  return <div className="ludo-shell min-h-screen" dir="rtl"><Starfield/><main className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-2 pb-4 pt-2">
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"><Button variant="neonIcon" size="icon" onClick={onHome}><Home/></Button><Brand/><div className="coin-pill"><span>🪙</span><b>892</b></div></header>
    <div className="mt-2 grid grid-cols-2 gap-2">{state.players.slice(0,2).map(p => <PlayerPlate key={p.seat} state={state} seatId={p.seat}/>)}</div>
    <section className="relative mx-auto my-2 w-full max-w-[min(92vw,34rem)]"><LudoBoard state={state} moves={moves} onTokenClick={onToken}/></section>
    <div className="grid grid-cols-2 gap-2">{state.players.slice(2).map(p => <PlayerPlate key={p.seat} state={state} seatId={p.seat}/>)}</div>
    <div className="mt-auto grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pt-3"><Button variant="neonIcon" size="icon" onClick={onMute}>{muted?<VolumeX/>:<Volume2/>}</Button><div className="min-w-0 text-center"><p className="truncate text-sm font-bold text-ludo-gold">{state.message}</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ludo-panel"><span className={cn("block h-full w-1/2",colorBg[seat.token])}/></div></div><Dice value={state.dice} rolling={rolling} disabled={state.phase!=="roll"||player.isBot} onRoll={onRoll} seatToken={seat.token}/></div>
    {state.phase==="over"&&<div className="fixed inset-0 z-50 grid place-items-center bg-ludo-deep/85 p-5 backdrop-blur-sm"><div className="royal-panel w-full max-w-sm p-6 text-center"><Crown className="mx-auto size-24 text-ludo-gold" fill="currentColor"/><h2 className="title-ribbon text-2xl">مبروك الفوز!</h2><p className="my-4 text-lg">{player.name} هو ملك الطاولة</p><Button variant="play" size="xl" className="w-full" onClick={onRestart}>لعبة جديدة</Button><Button variant="ghostGold" className="mt-2 w-full" onClick={onHome}>العودة للرئيسية</Button></div></div>}
  </main></div>;
}

function PlayerPlate({ state, seatId }: { state: GameState; seatId: 0|1|2|3 }) { const p=state.players.find(x=>x.seat===seatId); if(!p)return null; const s=SEATS[seatId]; const active=currentPlayer(state).seat===seatId; return <div className={cn("player-plate",active&&"player-plate-active")} style={{"--seat":`var(--ludo-${s.token})`} as React.CSSProperties}><span className={cn("avatar-orb",colorBg[s.token])}>{p.isBot?<Bot/>:<Crown/>}</span><span className="min-w-0 flex-1"><b className="block truncate text-xs">{p.name}</b><small>{tokensDone(state,seatId)}/4 في المنزل</small></span>{active&&<span className="turn-dot"/>}</div>; }

function Starfield() { return <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true"><div className="stars stars-a"/><div className="stars stars-b"/></div>; }
