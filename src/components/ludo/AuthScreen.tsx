import { useState } from "react";
import { LogIn, LogOut, Mail, ShieldCheck, Trophy, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { sfx } from "@/lib/audio";

export function AuthPanel() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <p className="py-10 text-center text-ludo-soft">جارٍ التحقق من الحساب…</p>;

  if (user) {
    return (
      <div className="space-y-4">
        <div className="coin-card flex items-center gap-3">
          <span className="avatar-orb bg-ludo-gold text-2xl">{profile?.avatar ?? "👑"}</span>
          <span className="min-w-0 flex-1">
            <b className="block truncate text-lg text-ludo-gold">{profile?.display_name ?? "لاعب"}</b>
            <small className="block truncate text-ludo-soft">{user.email}</small>
          </span>
          <ShieldCheck className="size-6 text-ludo-palm" />
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <StatBox label="النقاط" value={profile?.points ?? 0} />
          <StatBox label="فوز" value={profile?.wins ?? 0} />
          <StatBox label="خسارة" value={profile?.losses ?? 0} />
          <StatBox label="لعبات" value={profile?.games ?? 0} />
        </div>
        <ProfileNameForm current={profile?.display_name ?? ""} onSaved={refreshProfile} />
        <Button variant="ghostGold" className="w-full" onClick={() => void signOut()}>
          <LogOut /> تسجيل الخروج
        </Button>
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (err) throw err;
        setNote("تم إنشاء الحساب! تحقق من بريدك لتأكيد الحساب ثم سجّل الدخول.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        sfx.start();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) setError("تعذّر تسجيل الدخول بجوجل، حاول مرة أخرى");
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-ludo-soft">
        سجّل الدخول لحفظ نقاطك وإحصائياتك والمنافسة على لوحة المتصدرين
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant={mode === "login" ? "royal" : "neon"} onClick={() => setMode("login")}>
          <LogIn /> دخول
        </Button>
        <Button variant={mode === "signup" ? "royal" : "neon"} onClick={() => setMode("signup")}>
          <UserPlus /> حساب جديد
        </Button>
      </div>

      <div className="space-y-2">
        {mode === "signup" && (
          <Input placeholder="اسمك في اللعبة" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <Input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      {error && <p className="rounded-lg bg-destructive/20 p-2 text-center text-xs text-destructive-foreground">{error}</p>}
      {note && <p className="rounded-lg bg-ludo-palm/20 p-2 text-center text-xs text-ludo-soft">{note}</p>}

      <Button variant="play" size="xl" className="w-full" disabled={busy || !email || !password} onClick={() => void submit()}>
        <Mail /> {mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
      </Button>
      <Button variant="neon" className="w-full" onClick={() => void google()}>
        <Trophy /> المتابعة بحساب جوجل
      </Button>
    </div>
  );
}

function ProfileNameForm({ current, onSaved }: { current: string; onSaved: () => Promise<void> }) {
  const { user } = useAuth();
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || !value.trim()) return;
    setSaving(true);
    await supabase.from("profiles").update({ display_name: value.trim().slice(0, 40) }).eq("id", user.id);
    await onSaved();
    setSaving(false);
  };

  return (
    <div className="flex gap-2">
      <Input value={value} maxLength={40} onChange={(e) => setValue(e.target.value)} placeholder="اسمك الظاهر" />
      <Button variant="royal" disabled={saving} onClick={() => void save()}>حفظ</Button>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-ludo-gold/40 bg-ludo-panel/80 p-2">
      <b className="block text-lg text-ludo-gold">{value}</b>
      <small className="text-[10px] text-ludo-soft">{label}</small>
    </div>
  );
}
