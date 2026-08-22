import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Bot,
  ChevronLeft,
  Crown,
  Coins,
  Gem,
  Gift,
  History,
  Layers,
  Target,
  Home,
  ListOrdered,
  Medal,
  Menu,
  Plus,
  Settings,
  Sparkles,
  Trophy,
  UserCircle2,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import brandMark from "@/assets/brand-mark.png";
import coinStack from "@/assets/coin-stack.png";
import gemEmerald from "@/assets/gem-emerald.png";
import giftBox from "@/assets/gift-box.png";
import chestClosed from "@/assets/chest-closed.png";
import diceRoyal from "@/assets/dice-royal.png";
import avatarTiger from "@/assets/avatar-tiger.png";
import mode2p from "@/assets/mode-2p.png";
import mode4p from "@/assets/mode-4p.png";
import modeDomino from "@/assets/mode-domino.png";
import modeMissions from "@/assets/mode-missions.png";
import modeLedger from "@/assets/mode-ledger.png";
import chestOpen from "@/assets/chest-open.png";
import modeRules from "@/assets/mode-rules.png";
import navHome from "@/assets/nav-home.png";
import navStore from "@/assets/nav-store.png";
import navFriends from "@/assets/nav-friends.png";
import navTrophy from "@/assets/nav-trophy.png";
import navSettings from "@/assets/nav-settings.png";
import { Dice } from "./Dice";
import { LudoBoard } from "./LudoBoard";
import { RulesContent } from "./RulesScreen";
import { Leaderboard } from "./LeaderboardScreen";
import { AuthPanel } from "./AuthScreen";
import { SettingsPanel } from "./SettingsScreen";
import { MatchHistory } from "./HistoryScreen";
import { MissionsPanel } from "./MissionsScreen";
import { ChestsPanel } from "./ChestsScreen";
import { LedgerPanel } from "./LedgerScreen";
import { OpenedChestsPanel } from "./OpenedChestsScreen";
import { DominoGame } from "@/components/domino/DominoGame";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import {
  initAudio,
  loadMuted,
  loadVolume,
  setMuted as persistMuted,
  setVolume as persistVolume,
  sfx,
} from "@/lib/audio";
import { applyAnimations, loadAnimations, setAnimations as persistAnimations } from "@/lib/prefs";
import { useServerFn } from "@tanstack/react-start";
import { submitMatchResult } from "@/lib/match.functions";
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

type Screen =
  | "home"
  | "setup"
  | "rooms"
  | "rewards"
  | "tournaments"
  | "rules"
  | "leaderboard"
  | "account"
  | "history"
  | "settings"
  | "missions"
  | "chests"
  | "ledger"
  | "opened"
  | "domino"
  | "game";

const colorBg: Record<string, string> = {
  ruby: "bg-ludo-ruby",
  palm: "bg-ludo-palm",
  amber: "bg-ludo-amber",
  lagoon: "bg-ludo-lagoon",
};

export function LudoApp() {
  return (
    <AuthProvider>
      <LudoShell />
    </AuthProvider>
  );
}

function LudoShell() {
  const { user, refreshProfile } = useAuth();
  const [screen, setScreen] = useState<Screen>("home");
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [humanCount, setHumanCount] = useState(1);
  const [game, setGame] = useState<GameState>(() => createGame(4, 1));
  const [rolling, setRolling] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [animations, setAnimations] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const savedFor = useRef<string | null>(null);
  const matchId = useRef<string>("");
  const matchStart = useRef<number>(0);
  const moveCount = useRef(0);
  const sendResult = useServerFn(submitMatchResult);

  useEffect(() => {
    setMuted(loadMuted());
    setVolume(loadVolume());
    const anim = loadAnimations();
    setAnimations(anim);
    applyAnimations(anim);
  }, []);

  const changeVolume = (next: number) => {
    setVolume(next);
    persistVolume(next);
  };

  const changeAnimations = (next: boolean) => {
    setAnimations(next);
    persistAnimations(next);
  };

  const showCelebration = useCallback(
    (ms: number) => {
      if (!animations) return;
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), ms);
    },
    [animations],
  );

  const toggleMute = (value?: boolean) => {
    setMuted((prev) => {
      const next = value ?? !prev;
      persistMuted(next);
      if (!next) sfx.tap();
      return next;
    });
  };

  const moves = useMemo(
    () => (game.phase === "move" && game.dice ? legalMoves(game, game.dice) : []),
    [game],
  );
  const player = currentPlayer(game);

  const navigate = useCallback((next: Screen) => {
    initAudio();
    sfx.tap();
    setScreen(next);
  }, []);

  const startGame = () => {
    initAudio();
    setGame(createGame(playerCount, Math.min(humanCount, playerCount)));
    savedFor.current = null;
    matchId.current = crypto.randomUUID();
    matchStart.current = Date.now();
    moveCount.current = 0;
    sfx.start();
    setScreen("game");
    showCelebration(1600);
  };

  const startDomino = () => {
    initAudio();
    matchId.current = crypto.randomUUID();
    matchStart.current = Date.now();
    savedFor.current = null;
    sfx.start();
    setScreen("domino");
  };

  const reportMatch = useCallback(
    (payload: {
      result: "win" | "loss";
      players: number;
      moves: number;
      mode: "ludo" | "domino";
    }) => {
      const key = `${matchId.current}-${payload.result}-${payload.mode}`;
      if (!user || !matchId.current || savedFor.current === key) return;
      savedFor.current = key;
      void sendResult({
        data: {
          matchId: matchId.current,
          result: payload.result,
          players: payload.players,
          moves: payload.moves,
          durationMs: Math.max(0, Date.now() - matchStart.current),
          mode: payload.mode,
        },
      })
        .then(() => refreshProfile())
        .catch(() => {
          savedFor.current = null;
        });
    },
    [user, sendResult, refreshProfile],
  );

  const handleRoll = () => {
    if (rolling || game.phase !== "roll") return;
    initAudio();
    setRolling(true);
    sfx.diceRoll();
    window.setTimeout(() => {
      const value = rollDie();
      setGame((g) => applyRoll(g, value));
      sfx.diceLand(value);
      setRolling(false);
    }, 620);
  };

  const commitMove = useCallback((state: GameState, move: ReturnType<typeof legalMoves>[number]) => {
    moveCount.current += 1;
    if (move.captures.length) sfx.capture();
    else if (move.finishes) sfx.home();
    else sfx.move();
    return applyMove(state, move);
  }, []);

  const handleToken = (id: string) => {
    const move = moves.find((item) => item.tokenId === id);
    if (move) setGame((g) => commitMove(g, move));
  };

  // نوبة الروبوت
  useEffect(() => {
    if (screen !== "game" || game.phase === "over" || !player.isBot || rolling) return;
    const timer = window.setTimeout(() => {
      if (game.phase === "roll") {
        setRolling(true);
        sfx.diceRoll();
        window.setTimeout(() => {
          const value = rollDie();
          setGame((g) => applyRoll(g, value));
          sfx.diceLand(value);
          setRolling(false);
        }, 560);
      } else if (moves.length) {
        setGame((g) => commitMove(g, pickBotMove(moves)));
      }
    }, 720);
    return () => window.clearTimeout(timer);
  }, [screen, game.phase, game.turn, game.dice, game.winner, player.isBot, rolling, moves, commitMove]);

  // حركة وحيدة تُنفّذ تلقائيًا
  useEffect(() => {
    if (game.phase !== "move" || player.isBot || moves.length !== 1) return;
    const only = moves[0];
    if (!only) return;
    const timer = window.setTimeout(() => setGame((g) => commitMove(g, only)), 420);
    return () => window.clearTimeout(timer);
  }, [game.phase, game.turn, game.dice, player.isBot, moves, commitMove]);

  // احتفال + حفظ النتيجة (يتم التحقق منها في السيرفر)
  useEffect(() => {
    if (game.phase !== "over" || game.winner === null) return;
    sfx.win();
    showCelebration(4200);

    const mySeat = game.players.find((p) => !p.isBot)?.seat;
    if (mySeat !== undefined) {
      reportMatch({
        result: game.winner === mySeat ? "win" : "loss",
        players: game.players.length,
        moves: moveCount.current,
        mode: "ludo",
      });
    }
  }, [game.phase, game.winner, game.players, reportMatch, showCelebration]);

  if (screen === "domino") {
    return (
      <DominoGame
        playerCount={playerCount}
        humanCount={humanCount}
        muted={muted}
        onMute={() => toggleMute()}
        onHome={() => navigate("home")}
        onFinish={({ winnerSeat, mySeat, players, moves }) => {
          showCelebration(3200);
          reportMatch({
            result: winnerSeat === mySeat ? "win" : "loss",
            players,
            moves,
            mode: "domino",
          });
        }}
      />
    );
  }

  if (screen === "game") {
    return (
      <GameScreen
        state={game}
        moves={moves}
        rolling={rolling}
        muted={muted}
        celebrate={celebrate}
        onMute={() => toggleMute()}
        onRoll={handleRoll}
        onToken={handleToken}
        onHome={() => navigate("home")}
        onRules={() => navigate("rules")}
        onRestart={startGame}
      />
    );
  }

  return (
    <div className="ludo-shell min-h-screen" dir="rtl">
      <Starfield />
      <div className="relative mx-auto min-h-screen w-full max-w-md px-3 pb-24 pt-3 sm:pt-5">
        <TopBar muted={muted} onMute={() => toggleMute()} onMenu={() => navigate("home")} onAccount={() => navigate("account")} />
        {screen === "home" && <HomeScreen navigate={navigate} quickPlay={startGame} dominoPlay={startDomino} />}
        {screen === "setup" && (
          <SetupScreen
            players={playerCount}
            humans={humanCount}
            setPlayers={setPlayerCount}
            setHumans={setHumanCount}
            onStart={startGame}
            onBack={() => navigate("home")}
          />
        )}
        {screen === "rooms" && <RoomsScreen onBack={() => navigate("home")} onPlay={startGame} />}
        {screen === "rewards" && <RewardsScreen onBack={() => navigate("home")} />}
        {screen === "tournaments" && <TournamentsScreen onBack={() => navigate("home")} />}
        {screen === "rules" && (
          <PanelPage title="قواعد اللعبة" icon={<BookOpen />} onBack={() => navigate("home")}>
            <RulesContent />
          </PanelPage>
        )}
        {screen === "leaderboard" && (
          <PanelPage title="لوحة المتصدرين" icon={<ListOrdered />} onBack={() => navigate("home")}>
            <Leaderboard meId={user?.id ?? null} />
          </PanelPage>
        )}
        {screen === "history" && (
          <PanelPage title="سجل المباريات" icon={<History />} onBack={() => navigate("home")}>
            <MatchHistory meId={user?.id ?? null} />
          </PanelPage>
        )}
        {screen === "settings" && (
          <PanelPage title="الإعدادات" icon={<Settings />} onBack={() => navigate("home")}>
            <SettingsPanel
              muted={muted}
              volume={volume}
              animations={animations}
              onMuted={(v) => toggleMute(v)}
              onVolume={changeVolume}
              onAnimations={changeAnimations}
            />
          </PanelPage>
        )}
        {screen === "missions" && (
          <PanelPage title="المهام" icon={<Target />} onBack={() => navigate("home")}>
            <MissionsPanel signedIn={Boolean(user)} onWalletChange={() => void refreshProfile()} />
          </PanelPage>
        )}
        {screen === "chests" && (
          <PanelPage title="الصناديق" icon={<Gift />} onBack={() => navigate("home")}>
            <ChestsPanel
              signedIn={Boolean(user)}
              animations={animations}
              onWalletChange={() => void refreshProfile()}
            />
          </PanelPage>
        )}
        {screen === "ledger" && (
          <PanelPage title="سجل المعاملات" icon={<History />} onBack={() => navigate("home")}>
            <LedgerPanel signedIn={Boolean(user)} />
          </PanelPage>
        )}
        {screen === "opened" && (
          <PanelPage title="الصناديق المفتوحة" icon={<Gift />} onBack={() => navigate("home")}>
            <OpenedChestsPanel signedIn={Boolean(user)} />
          </PanelPage>
        )}
        {screen === "account" && (
          <PanelPage title="حسابي" icon={<UserCircle2 />} onBack={() => navigate("home")}>
            <AuthPanel />
          </PanelPage>
        )}
        <BottomNav active={screen} navigate={navigate} />
      </div>
      {celebrate && <Confetti />}
    </div>
  );
}

function TopBar({ muted, onMute, onMenu, onAccount }: { muted: boolean; onMute: () => void; onMenu: () => void; onAccount: () => void }) {
  const { profile, user } = useAuth();
  const xp = (profile?.xp ?? 0) % 300;
  return (
    <header className="space-y-2">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <button type="button" onClick={onAccount} className="relative" aria-label="حسابي">
          <span className="level-orb">
            {user ? (
              profile?.avatar && profile.avatar.length <= 3
                ? <span>{profile.avatar}</span>
                : <img src={avatarTiger} alt="" width={512} height={512} loading="lazy" />
            ) : <img src={avatarTiger} alt="" width={512} height={512} loading="lazy" />}
          </span>
          <span className="level-chip">{user ? `مستوى ${profile?.level ?? 1}` : "دخول"}</span>
        </button>
        <div className="min-w-0">
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onAccount} className="hud-pill" aria-label="الذهب">
              <img src={coinStack} alt="" width={512} height={512} loading="lazy" />
              <b>{user ? profile?.gold ?? 0 : 0}</b>
              <span className="hud-plus">+</span>
            </button>
            <button type="button" onClick={onAccount} className="hud-pill" aria-label="الجواهر">
              <img src={gemEmerald} alt="" width={512} height={512} loading="lazy" />
              <b>{user ? profile?.diamonds ?? 0 : 0}</b>
              <span className="hud-plus">+</span>
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="xp-track flex-1"><span className="xp-fill" style={{ width: `${(xp / 300) * 100}%` }} /></div>
            <small className="shrink-0 text-[10px] font-bold text-ludo-gold">{xp}/300 XP</small>
          </div>
        </div>
        <div className="grid gap-1">
          <Button variant="neonIcon" size="icon" aria-label="القائمة" onClick={onMenu}><Menu /></Button>
          <Button variant="neonIcon" size="icon" aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"} onClick={onMute}>
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
        </div>
      </div>
      <Brand />
    </header>
  );
}

function Brand() {
  return (
    <div className="min-w-0 text-center">
      <img src={brandMark} alt="شعار عبقور لودو" width={512} height={512} className="asset-shine mx-auto -mb-2 size-16" />
      <h1 className="truncate font-display text-2xl font-black text-ludo-gold text-shadow-glow">ABQOR LUDO</h1>
      <p className="-mt-1 text-xs font-bold text-ludo-pink">عبقور لودو</p>
    </div>
  );
}

function HomeScreen({ navigate, quickPlay, dominoPlay }: { navigate: (s: Screen) => void; quickPlay: () => void; dominoPlay: () => void }) {
  return (
    <main className="mt-3 space-y-4 pb-24">
      <h2 className="ribbon-title">اختر نمط اللعب</h2>

      <div className="grid grid-cols-2 gap-3">
        <ModeCard tone="green" img={mode2p} title="لعب سريع" subtitle="ضد الروبوت" onClick={quickPlay} />
        <ModeCard tone="gold" img={mode4p} title="لعب محلي" subtitle="2 – 4 لاعبين" onClick={() => navigate("setup")} />
        <ModeCard tone="violet" img={modeDomino} title="دومينو" subtitle="حجارة ثلاثية الأبعاد" onClick={dominoPlay} />
        <ModeCard tone="pink" img={navTrophy} title="المتصدرون" subtitle="ترتيب اللاعبين" onClick={() => navigate("leaderboard")} />
      </div>

      <section className="glossy-card">
        <div className="relative grid grid-cols-4 gap-2">
          <SmallTile img={modeMissions} label="المهام" onClick={() => navigate("missions")} />
          <SmallTile img={chestClosed} label="الصناديق" onClick={() => navigate("chests")} />
          <SmallTile img={modeRules} label="القواعد" onClick={() => navigate("rules")} />
          <SmallTile img={navFriends} label="الغرف" onClick={() => navigate("rooms")} />
          <SmallTile img={navTrophy} label="البطولات" onClick={() => navigate("tournaments")} />
          <SmallTile img={diceRoyal} label="السجل" onClick={() => navigate("history")} />
          <SmallTile img={modeLedger} label="المعاملات" onClick={() => navigate("ledger")} />
          <SmallTile img={chestOpen} label="صناديقي" onClick={() => navigate("opened")} />
          <SmallTile img={avatarTiger} label="حسابي" onClick={() => navigate("account")} />
          <SmallTile img={navSettings} label="الإعدادات" onClick={() => navigate("settings")} />
        </div>
      </section>

      <button className="glossy-card flex w-full items-center gap-3 text-right" type="button" onClick={() => navigate("chests")}>
        <img src={giftBox} alt="" width={512} height={512} loading="lazy" className="asset-shine relative size-16 shrink-0" />
        <span className="relative min-w-0 flex-1">
          <b className="block text-lg text-ludo-gold">هدية اليوم جاهزة!</b>
          <small className="text-ludo-soft">افتح الصندوق واجمع الذهب والجواهر</small>
        </span>
        <ChevronLeft className="relative size-6 shrink-0 text-ludo-gold" />
      </button>
    </main>
  );
}

function ModeCard({ tone, img, title, subtitle, onClick }: { tone: string; img: string; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("mode-tile", `tile-${tone}`)}>
      <img src={img} alt="" width={512} height={512} loading="lazy" />
      <b>{title}</b>
      <small>{subtitle}</small>
    </button>
  );
}

function SmallTile({ img, label, onClick }: { img: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="relative grid place-items-center gap-1 rounded-xl border border-white/15 bg-black/25 p-2 transition active:translate-y-0.5">
      <img src={img} alt="" width={512} height={512} loading="lazy" className="asset-shine size-10" />
      <small className="text-[10px] font-bold text-ludo-soft">{label}</small>
    </button>
  );
}

function SetupScreen({ players, humans, setPlayers, setHumans, onStart, onBack }: { players: 2 | 3 | 4; humans: number; setPlayers: (v: 2 | 3 | 4) => void; setHumans: (v: number) => void; onStart: () => void; onBack: () => void }) {
  return (
    <PanelPage title="تجهيز الطاولة" icon={<Users />} onBack={onBack}>
      <p className="mb-3 text-center text-sm text-ludo-soft">اختر عدد المشاركين واللاعبين الحقيقيين</p>
      <SettingBlock title="عدد اللاعبين">
        <div className="grid grid-cols-3 gap-2">{([2, 3, 4] as const).map((n) => <Button key={n} variant={players === n ? "royal" : "neon"} onClick={() => { setPlayers(n); setHumans(Math.min(humans, n)); }}>{n} لاعبين</Button>)}</div>
      </SettingBlock>
      <SettingBlock title="اللاعبون المحليون">
        <div className="grid grid-cols-4 gap-2">{[1, 2, 3, 4].filter((n) => n <= players).map((n) => <Button key={n} variant={humans === n ? "royal" : "neon"} onClick={() => setHumans(n)}>{n}</Button>)}</div>
        <p className="mt-3 text-xs text-ludo-soft">سيكمل الروبوت المقاعد المتبقية تلقائيًا</p>
      </SettingBlock>
      <Button variant="play" size="xl" className="mt-5 w-full" onClick={onStart}>ابدأ اللعبة <Crown /></Button>
    </PanelPage>
  );
}

function RoomsScreen({ onBack, onPlay }: { onBack: () => void; onPlay: () => void }) {
  const rooms = ["غرفة المرح", "أصدقاء عبقور", "تحدّي الأبطال", "شوق اللعبة"];
  return <PanelPage title="الغرف المتاحة" icon={<Users />} onBack={onBack}><div className="space-y-2">{rooms.map((name, i) => <div className="list-card" key={name}><span className="avatar-orb bg-ludo-purple text-ludo-gold">{i + 1}</span><span className="min-w-0 flex-1"><b className="block truncate">{name}</b><small className="text-ludo-soft">{i % 2 ? "2 / 4" : "3 / 4"} لاعبين</small></span><Button variant="play" size="sm" onClick={onPlay}>انضم</Button></div>)}</div><Button variant="royal" className="mt-4 w-full"><Plus /> إنشاء غرفة</Button></PanelPage>;
}

function RewardsScreen({ onBack }: { onBack: () => void }) {
  const items = [["🪙", "1000 عملة"], ["🎁", "صندوق ملكي"], ["👑", "تاج الملك"], ["💎", "100 جوهرة"]];
  return <PanelPage title="المكافآت" icon={<Gift />} onBack={onBack}><div className="reward-hero"><Gift className="size-20 text-ludo-gold" /><b>هدية يومية مميزة</b><span>عد غدًا لمفاجأة جديدة</span></div><div className="mt-3 grid grid-cols-2 gap-3">{items.map(([icon, name], i) => <div className="reward-card" key={name}><span className="text-5xl">{icon}</span><b>{name}</b><Button variant={i === 0 ? "play" : "neon"} size="sm">{i === 0 ? "استلم" : "قريبًا"}</Button></div>)}</div></PanelPage>;
}

function TournamentsScreen({ onBack }: { onBack: () => void }) {
  return <PanelPage title="البطولات" icon={<Trophy />} onBack={onBack}><div className="trophy-stage"><Trophy className="size-24 text-ludo-gold" fill="currentColor" /><h3>بطولة عبقور الكبرى</h3><p>الجائزة الكبرى 20,000 عملة</p><div className="countdown"><span><b>05</b> أيام</span><span><b>12</b> ساعة</span><span><b>36</b> دقيقة</span></div></div>{["بطولة السرعة", "تحدّي الأصدقاء", "بطولة المحترفين"].map((x, i) => <div className="list-card mt-2" key={x}><Medal className="size-8 text-ludo-gold" /><span className="flex-1"><b className="block">{x}</b><small className="text-ludo-soft">{i + 2} أيام متبقية</small></span><Button variant="neon" size="sm">التفاصيل</Button></div>)}</PanelPage>;
}

function PanelPage({ title, icon, onBack, children }: { title: string; icon: React.ReactNode; onBack: () => void; children: React.ReactNode }) {
  return <main className="royal-panel glow-rise mt-4 p-3"><header className="title-ribbon mb-4 grid grid-cols-[auto_1fr_auto] items-center"><Button variant="ghostGold" size="icon" onClick={onBack}><ChevronLeft className="rotate-180" /></Button><h2 className="flex items-center justify-center gap-2 text-xl">{icon}{title}</h2><span className="size-9" /></header>{children}</main>;
}

function SettingBlock({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mb-3 rounded-xl border border-ludo-gold/35 bg-ludo-panel/70 p-3"><h3 className="mb-3 font-bold text-ludo-gold">{title}</h3>{children}</section>; }

function BottomNav({ active, navigate }: { active: Screen; navigate: (s: Screen) => void }) {
  const links: [Screen, string, string][] = [
    ["home", navHome, "الرئيسية"],
    ["leaderboard", navTrophy, "المتصدرون"],
    ["chests", navStore, "المتجر"],
    ["account", navFriends, "حسابي"],
    ["settings", navSettings, "الإعدادات"],
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-md grid-cols-5 gap-1 border-t-2 border-ludo-gold/70 bg-[linear-gradient(180deg,#4a0d33,#170512)] px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgb(0_0_0/.55)]">
      {links.map(([id, icon, label]) => (
        <button type="button" key={id} onClick={() => navigate(id)} className={cn("nav-3d", active === id && "nav-3d-active")}>
          <img src={icon} alt="" width={512} height={512} loading="lazy" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function GameScreen({ state, moves, rolling, muted, celebrate, onMute, onRoll, onToken, onHome, onRules, onRestart }: { state: GameState; moves: ReturnType<typeof legalMoves>; rolling: boolean; muted: boolean; celebrate: boolean; onMute: () => void; onRoll: () => void; onToken: (id: string) => void; onHome: () => void; onRules: () => void; onRestart: () => void }) {
  const player = currentPlayer(state);
  const seat = SEATS[player.seat];
  return <div className="ludo-shell min-h-screen" dir="rtl"><Starfield /><div className="crown-pattern fixed inset-0" aria-hidden="true" /><main className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-2 pb-4 pt-2">
    <header className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2"><Button variant="neonIcon" size="icon" aria-label="الرئيسية" onClick={onHome}><Home /></Button><Button variant="neonIcon" size="icon" aria-label="القواعد" onClick={onRules}><BookOpen /></Button><Brand /><Button variant="neonIcon" size="icon" aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"} onClick={onMute}>{muted ? <VolumeX /> : <Volume2 />}</Button></header>
    <div className="mt-2 grid grid-cols-2 gap-2">{state.players.slice(0, 2).map((p) => <PlayerPlate key={p.seat} state={state} seatId={p.seat} />)}</div>
    <section className="board-frame relative mx-auto my-2 w-full max-w-[min(92vw,34rem)]"><LudoBoard state={state} moves={moves} onTokenClick={onToken} /></section>
    <div className="grid grid-cols-2 gap-2">{state.players.slice(2).map((p) => <PlayerPlate key={p.seat} state={state} seatId={p.seat} />)}</div>
    <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pt-4"><div className="min-w-0 text-center"><p className="truncate text-sm font-bold text-ludo-gold">{state.message}</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ludo-panel"><span className={cn("block h-full w-1/2", colorBg[seat.token])} /></div></div><Dice value={state.dice} rolling={rolling} disabled={state.phase !== "roll" || player.isBot} onRoll={onRoll} seatToken={seat.token} /></div>
    {state.phase === "over" && <div className="fixed inset-0 z-[70] grid place-items-center bg-ludo-deep/85 p-5 backdrop-blur-sm"><div className="royal-panel celebrate-pop w-full max-w-sm p-6 text-center"><Crown className="mx-auto size-24 text-ludo-gold" fill="currentColor" /><h2 className="title-ribbon text-2xl">مبروك الفوز!</h2><p className="my-4 text-lg">{player.name} هو ملك الطاولة</p><Button variant="play" size="xl" className="w-full" onClick={onRestart}>لعبة جديدة</Button><Button variant="ghostGold" className="mt-2 w-full" onClick={onHome}>العودة للرئيسية</Button></div></div>}
  </main>{celebrate && <Confetti />}</div>;
}

function PlayerPlate({ state, seatId }: { state: GameState; seatId: 0 | 1 | 2 | 3 }) {
  const p = state.players.find((x) => x.seat === seatId);
  if (!p) return null;
  const s = SEATS[seatId];
  const active = currentPlayer(state).seat === seatId;
  return <div className={cn("player-plate", active && "player-plate-active")} style={{ ["--seat" as string]: `var(--ludo-${s.token})` }}><span className={cn("avatar-orb", colorBg[s.token])}>{p.isBot ? <Bot /> : <Crown />}</span><span className="min-w-0 flex-1"><b className="block truncate text-xs">{p.name}</b><small>{tokensDone(state, seatId)}/4 في المنزل</small></span>{active && <span className="turn-dot" />}</div>;
}

function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 46 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      duration: 2 + Math.random() * 1.6,
      color: ["var(--ludo-gold)", "var(--ludo-pink)", "var(--ludo-palm)", "var(--ludo-lagoon)", "var(--ludo-ruby)"][Math.floor(Math.random() * 5)],
    })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i key={i} style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }} />
      ))}
    </div>
  );
}

function Starfield() { return <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true"><div className="stars stars-a" /><div className="stars stars-b" /></div>; }
