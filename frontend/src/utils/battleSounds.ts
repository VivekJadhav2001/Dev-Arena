const MUTE_KEY = "devarena:battle-muted";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isBattleMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setBattleMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // storage is best-effort
  }
}

function tone(
  freq: number,
  durationSec: number,
  type: OscillatorType = "sine",
  volume = 0.12,
  whenSec = 0,
): void {
  if (isBattleMuted()) return;
  const audio = getCtx();
  if (!audio) return;
  try {
    const startAt = audio.currentTime + whenSec;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startAt + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(startAt);
    osc.stop(startAt + durationSec + 0.05);
  } catch {
    // audio is best-effort; never break the battle UI
  }
}

/** Short tick for the last seconds of the countdown. */
export function playTick(): void {
  tone(880, 0.08, "square", 0.05);
}

/** New question appeared. */
export function playQuestion(): void {
  tone(520, 0.09, "sine", 0.1);
}

/** Server-verified correct answer. */
export function playCorrect(): void {
  tone(660, 0.12, "sine", 0.12);
  tone(880, 0.16, "sine", 0.12, 0.1);
}

/** Server-verified wrong answer. */
export function playWrong(): void {
  tone(200, 0.25, "sawtooth", 0.08);
}

/** Battle started. */
export function playStart(): void {
  tone(523, 0.1, "sine", 0.1);
  tone(659, 0.1, "sine", 0.1, 0.09);
  tone(784, 0.18, "sine", 0.12, 0.18);
}

/** Countdown reached zero. */
export function playTimeout(): void {
  tone(440, 0.15, "square", 0.07);
  tone(349, 0.15, "square", 0.07, 0.14);
  tone(262, 0.3, "square", 0.07, 0.28);
}
