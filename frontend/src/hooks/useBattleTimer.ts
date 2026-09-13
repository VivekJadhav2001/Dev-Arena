import { useEffect, useState } from "react";

export interface BattleTimer {
  secondsLeft: number;
  total: number;
  expired: boolean;
  progress: number;
}

/**
 * Countdown derived from the server-authoritative `startedAt + timeLimit`.
 * Display-only: the server remains authoritative for scoring/winner.
 */
export function useBattleTimer(
  startedAt: string | null,
  timeLimitSec: number,
  active: boolean,
): BattleTimer {
  const total = Number.isFinite(timeLimitSec) && timeLimitSec > 0 ? timeLimitSec : 60;

  const calc = (): number => {
    if (!active || !startedAt) return total;
    const startMs = new Date(startedAt).getTime();
    if (Number.isNaN(startMs)) return total;
    const deadline = startMs + total * 1000;
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(() => calc());

  useEffect(() => {
    // Timer subscription: sync once then tick from the external clock.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecondsLeft(calc());
    if (!active || !startedAt) return;
    const id = window.setInterval(() => setSecondsLeft(calc()), 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, total, active]);

  return {
    secondsLeft,
    total,
    expired: active && secondsLeft <= 0,
    progress: total > 0 ? Math.max(0, Math.min(1, secondsLeft / total)) : 0,
  };
}

export function formatBattleTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
