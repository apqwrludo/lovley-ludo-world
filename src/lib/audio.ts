/** محرك مؤثرات صوتية بسيط بالكامل عبر Web Audio API (بدون ملفات خارجية) */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

const STORAGE_KEY = "abqor-muted";

export function initAudio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function loadMuted(): boolean {
  if (typeof window === "undefined") return false;
  muted = window.localStorage.getItem(STORAGE_KEY) === "1";
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  if (master && ctx) master.gain.value = value ? 0 : 0.6;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.25) {
  const audio = initAudio();
  if (!audio || !master || muted) return;
  const t0 = audio.currentTime + start;
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(start: number, dur: number, gain = 0.3, filterFreq = 2600) {
  const audio = initAudio();
  if (!audio || !master || muted) return;
  const t0 = audio.currentTime + start;
  const frames = Math.max(1, Math.floor(audio.sampleRate * dur));
  const buffer = audio.createBuffer(1, frames, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.9;
  const env = audio.createGain();
  env.gain.setValueAtTime(gain, t0);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(env).connect(master);
  src.start(t0);
}

export const sfx = {
  tap() {
    tone(520, 0, 0.07, "triangle", 0.16);
  },
  /** صوت لف النرد: ارتطام خشبي متسارع ثم استقرار */
  diceRoll() {
    const hits = [0, 0.055, 0.1, 0.15, 0.21, 0.28, 0.36, 0.45];
    hits.forEach((t, i) => {
      noiseBurst(t, 0.05, 0.34 - i * 0.03, 1500 + i * 260);
      tone(150 + i * 22, t, 0.05, "square", 0.07);
    });
    noiseBurst(0.52, 0.12, 0.26, 1200);
    tone(220, 0.54, 0.12, "triangle", 0.12);
  },
  diceLand(value: number) {
    tone(440 + value * 55, 0, 0.13, "triangle", 0.2);
  },
  move() {
    tone(680, 0, 0.06, "sine", 0.14);
    tone(920, 0.06, 0.07, "sine", 0.12);
  },
  capture() {
    tone(300, 0, 0.1, "sawtooth", 0.2);
    tone(180, 0.09, 0.18, "sawtooth", 0.18);
    noiseBurst(0, 0.18, 0.22, 900);
  },
  home() {
    [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.16, "triangle", 0.18));
  },
  start() {
    [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.22, "triangle", 0.18));
  },
  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.12, 0.42, "triangle", 0.2));
    noiseBurst(0.1, 0.5, 0.14, 3800);
  },
};
