import {
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Code2,
  Copy,
  Flag,
  ListChecks,
  LoaderCircle,
  Lock,
  Play,
  Swords,
  Timer,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBattleTimer, formatBattleTime } from "../hooks/useBattleTimer";
import { copyText } from "../lib/clipboard";
import {
  arenaService,
  CODING_LANGUAGES,
  type IBattleRoomState,
  type IRunReport,
} from "../services/arena.service";
import type { IBattleQuestion } from "../types";
import { useAuthStore } from "../store/auth.store";
import { useSocketContext } from "../app/providers/SocketProvider";
import {
  isBattleMuted,
  playCorrect,
  playQuestion,
  playStart,
  playTick,
  playTimeout,
  playWrong,
  setBattleMuted,
} from "../utils/battleSounds";

function normalizeRoom(data: IBattleRoomState): IBattleRoomState {
  return {
    ...data,
    players: Array.isArray(data.players) ? data.players : [],
    // Backend returns [] while waiting and the question list while active.
    // Default to [] so `questions[currentIndex]` never throws on partial payloads.
    questions: Array.isArray(data.questions) ? data.questions : [],
  };
}

function toCodingLang(label: string | null | undefined, fallback = "python"): string {
  const key = (label ?? "").trim().toLowerCase();
  const map: Record<string, string> = {
    python: "python",
    javascript: "javascript",
    typescript: "typescript",
    java: "java",
    go: "go",
    rust: "rust",
  };
  if (map[key]) return map[key];
  if ((CODING_LANGUAGES as readonly string[]).includes(key)) return key;
  return fallback;
}

function CodingPanel({
  roomCode,
  question,
  initialCode,
  initialLanguage,
  initialRun,
  amIHost,
  lockBusy,
  onLock,
  onError,
}: {
  roomCode: string;
  question: IBattleQuestion;
  initialCode: string | null;
  initialLanguage: string | null;
  initialRun: IRunReport | null;
  amIHost: boolean;
  lockBusy: boolean;
  onLock: () => void;
  onError: (message: string) => void;
}) {
  const starter = question.code ?? "";
  const [language, setLanguage] = useState(
    () => initialLanguage ?? toCodingLang(question.language),
  );
  const [code, setCode] = useState(() => initialCode ?? starter);
  const [run, setRun] = useState<IRunReport | null>(initialRun);
  const [running, setRunning] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">(
    initialCode ? "saved" : "dirty",
  );
  const questionIdRef = useRef(question.questionId);
  const saveTimer = useRef<number | null>(null);

  // Reset editor when the room advances to a new question.
  useEffect(() => {
    if (questionIdRef.current === question.questionId) return;
    questionIdRef.current = question.questionId;
    setLanguage(initialLanguage ?? toCodingLang(question.language));
    setCode(initialCode ?? question.code ?? "");
    setRun(initialRun);
    setSaveState(initialCode ? "saved" : "dirty");
  }, [question.questionId, question.code, question.language, initialCode, initialLanguage, initialRun]);

  // Debounced autosave — the host locks the latest saved code.
  // "dirty" is set from input handlers; this effect only schedules the save.
  useEffect(() => {
    if (saveState !== "dirty") return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    if (code === (initialCode ?? starter)) return;
    saveTimer.current = window.setTimeout(() => {
      setSaveState("saving");
      void arenaService
        .saveCode(roomCode, { questionId: question.questionId, language, code })
        .then(() => setSaveState("saved"))
        .catch((err: unknown) => {
          setSaveState("dirty");
          onError(err instanceof Error ? err.message : "Unable to save code.");
        });
    }, 1500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [code, language, roomCode, question.questionId, initialCode, starter, saveState, onError]);

  async function changeLanguage(next: string) {
    setLanguage(next);
    setSaveState("saving");
    try {
      await arenaService.saveCode(roomCode, {
        questionId: question.questionId,
        language: next,
        code,
      });
      setSaveState("saved");
    } catch (err) {
      setSaveState("dirty");
      onError(err instanceof Error ? err.message : "Unable to save code.");
    }
  }

  async function runTests() {
    setRunning(true);
    try {
      const report = await arenaService.runCode(roomCode, {
        questionId: question.questionId,
        language,
        code,
      });
      setRun(report);
      setSaveState("saved");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Unable to run code.");
    } finally {
      setRunning(false);
    }
  }

  function insertTab(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const next = `${code.slice(0, start)}  ${code.slice(el.selectionEnd)}`;
    setCode(next);
    setSaveState("dirty");
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 2;
    });
  }

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-border bg-background p-4 text-sm leading-relaxed">
        <p>{question.statement}</p>
        <div className="mt-3 grid gap-2 text-[13px]">
          <p>
            <b className="text-text">Input — </b>
            <span className="text-textMuted">{question.inputDescription}</span>
          </p>
          <p>
            <b className="text-text">Output — </b>
            <span className="text-textMuted">{question.outputDescription}</span>
          </p>
          {question.constraints.length > 0 && (
            <div>
              <b className="text-text">Constraints</b>
              <ul className="mt-1 list-disc pl-5 text-textMuted">
                {question.constraints.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-background p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-textMuted">
          Visible examples
        </p>
        <div className="mt-2 space-y-2">
          {question.examples.map((ex, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <pre className="overflow-x-auto rounded-lg bg-surface p-3 font-mono text-xs">
                <span className="text-textSubtle">in: </span>
                {ex.input}
              </pre>
              <pre className="overflow-x-auto rounded-lg bg-surface p-3 font-mono text-xs">
                <span className="text-textSubtle">out: </span>
                {ex.output}
              </pre>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-textSubtle">
          Hidden tests run when the host locks — they decide the points.
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={language}
          onChange={(e) => void changeLanguage(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold"
          aria-label="Programming language"
        >
          {CODING_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button
          onClick={() => void runTests()}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-background disabled:opacity-60"
        >
          {running ? (
            <LoaderCircle className="animate-spin" size={16} />
          ) : (
            <Play size={16} />
          )}
          {running ? "Running…" : "Run code"}
        </button>
        <span className="text-xs text-textMuted">
          {saveState === "saved" && "Saved ✓"}
          {saveState === "saving" && "Saving…"}
          {saveState === "dirty" && "Unsaved changes"}
        </span>
      </div>

      <textarea
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          setSaveState("dirty");
        }}
        onKeyDown={insertTab}
        spellCheck={false}
        rows={14}
        className="mt-3 w-full rounded-xl border border-border bg-background p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-primary/60"
        aria-label="Code editor"
      />

      {run && (
        <div className="mt-3 rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-textMuted">
            Test cases — {run.testsPassed} / {run.testsTotal} passed
            {run.executionTimeMs > 0 && ` · ${run.executionTimeMs} ms`}
            {run.memoryKb != null && ` · ${run.memoryKb} KB`}
          </p>
          <div className="mt-2 space-y-1.5">
            {run.results.map((t, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                  t.passed ? "bg-primary/10" : "bg-danger/10"
                }`}
              >
                {t.passed ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />
                ) : (
                  <XCircle size={16} className="mt-0.5 shrink-0 text-red-300" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold">
                    Test case {i + 1}
                    {t.error && !t.passed && (
                      <span className="ml-2 font-mono text-xs font-normal text-red-200">
                        {t.error.slice(0, 160)}
                      </span>
                    )}
                  </p>
                  {!t.passed && !t.error && (
                    <pre className="mt-1 overflow-x-auto font-mono text-xs text-textMuted">
                      expected: {t.expected.slice(0, 200)}
                      {"\n"}got: {(t.actual || "(empty)").slice(0, 200)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
          {run.error && (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-danger/10 p-3 font-mono text-xs text-red-200">
              {run.error.slice(0, 1000)}
            </pre>
          )}
        </div>
      )}

      {amIHost && (
        <button
          onClick={onLock}
          disabled={lockBusy}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-background disabled:opacity-60"
        >
          {lockBusy ? (
            <LoaderCircle className="animate-spin" size={17} />
          ) : (
            <Lock size={17} />
          )}
          {lockBusy ? "Evaluating everyone…" : "Lock & evaluate for everyone"}
        </button>
      )}
    </div>
  );
}

export default function BattleRoom() {
  const { roomCode = "" } = useParams();
  const navigate = useNavigate();
  const socket = useSocketContext();
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const [room, setRoom] = useState<IBattleRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockBusy, setLockBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [savingPick, setSavingPick] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => isBattleMuted());
  const [verdictVisible, setVerdictVisible] = useState(false);
  const questionStartedAt = useRef<number>(0);
  const firstQuestionRef = useRef(true);
  const prevSecondsRef = useRef<number | null>(null);
  const timeoutPlayedRef = useRef(false);
  const shownVerdictRef = useRef<string | null>(null);
  const verdictTimer = useRef<number | null>(null);

  const showError = useCallback((message: string) => setError(message), []);

  const load = useCallback(async () => {
    try {
      const response = await arenaService.getRoom(roomCode);
      setRoom(normalizeRoom(response.data));
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to load this battle room.",
      );
    }
  }, [roomCode]);

  // Realtime sync: server pings `battle:updated` on every mutation;
  // polling stays as a fallback.
  useEffect(() => {
    if (!socket || !roomCode) return;
    socket.emit("battle:join", { roomCode });
    const refresh = () => void load();
    socket.on("battle:updated", refresh);
    return () => {
      socket.off("battle:updated", refresh);
      socket.emit("battle:leave", { roomCode });
    };
  }, [socket, roomCode, load]);

  useEffect(() => {
    // Polling resolves asynchronously before calling setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (room?.status === "finished")
      navigate(`/battle/${room.roomCode}/result`);
  }, [room?.status, room?.roomCode, navigate]);

  const questions = room?.questions ?? [];
  const question =
    room && room.status === "active"
      ? (questions[room.currentQuestionIndex] ?? null)
      : null;
  const options = question?.options ?? [];
  const isCoding = question?.type === "coding";

  const battleTimer = useBattleTimer(
    room?.startedAt ?? null,
    room?.timeLimit ?? 60,
    room?.status === "active",
  );

  // Sync local selection when the room advances; play a blip for new questions.
  // NOTE: deps are scalar ids on purpose — `question`/`room` get new object
  // identity on every poll and must not reset per-question state.
  useEffect(() => {
    questionStartedAt.current = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicked(room?.mySelection ?? null);
    if (firstQuestionRef.current) {
      firstQuestionRef.current = false;
      return;
    }
    if (question?.questionId) playQuestion();
  }, [question?.questionId, room?.mySelection]);

  // Server verdicts arrive on lock: banner + sound, auto-hide after a while.
  const verdict = room?.lastVerdict ?? null;
  const verdictForOtherQuestion =
    verdict != null && question != null && verdict.questionId !== question.questionId;
  useEffect(() => {
    if (!verdict || !verdictForOtherQuestion) return;
    if (shownVerdictRef.current === verdict.questionId) return;
    shownVerdictRef.current = verdict.questionId;
    if (verdict.correct) playCorrect();
    else playWrong();
    setVerdictVisible(true);
    if (verdictTimer.current) window.clearTimeout(verdictTimer.current);
    verdictTimer.current = window.setTimeout(() => setVerdictVisible(false), 8000);
    return () => {
      if (verdictTimer.current) window.clearTimeout(verdictTimer.current);
    };
  }, [verdict, verdictForOtherQuestion]);

  // Countdown sounds: tick the last 5 seconds, buzz once at zero.
  useEffect(() => {
    if (room?.status !== "active") {
      prevSecondsRef.current = null;
      timeoutPlayedRef.current = false;
      return;
    }
    const prev = prevSecondsRef.current;
    prevSecondsRef.current = battleTimer.secondsLeft;
    if (
      battleTimer.secondsLeft <= 5 &&
      battleTimer.secondsLeft > 0 &&
      prev !== null &&
      battleTimer.secondsLeft < prev
    ) {
      playTick();
    }
    if (battleTimer.expired && !timeoutPlayedRef.current) {
      timeoutPlayedRef.current = true;
      playTimeout();
    }
    if (!battleTimer.expired) timeoutPlayedRef.current = false;
  }, [battleTimer.secondsLeft, battleTimer.expired, room?.status]);

  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      setBattleMuted(next);
      return next;
    });
  }

  async function start() {
    setBusy(true);
    try {
      const response = await arenaService.startBattle(roomCode);
      setRoom(normalizeRoom(response.data));
      firstQuestionRef.current = true;
      playStart();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start the battle.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function forfeit() {
    if (!window.confirm("Forfeit this battle?")) return;
    try {
      await arenaService.forfeit(roomCode);
      navigate(`/battle/${roomCode}/result`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to forfeit the battle.",
      );
    }
  }

  // MCQ select: saves a changeable pre-lock selection, never advances.
  async function select(option: string) {
    if (!question || isCoding || savingPick || lockBusy) return;
    setPicked(option);
    setSavingPick(true);
    try {
      // timeTaken is scoring telemetry sent to the server, not render state.
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      const timeTaken = Math.max(
        0,
        Math.round((now - questionStartedAt.current) / 1000),
      );
      await arenaService.answer(roomCode, {
        questionId: question.questionId,
        answer: option,
        timeTaken,
      });
      void load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save your selection.",
      );
      setPicked(room?.mySelection ?? null);
    } finally {
      setSavingPick(false);
    }
  }

  async function lock() {
    if (lockBusy) return;
    setLockBusy(true);
    try {
      const response = await arenaService.lock(roomCode);
      setRoom(normalizeRoom(response.data));
      playStart();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to lock the question.",
      );
    } finally {
      setLockBusy(false);
    }
  }

  async function copyCode() {
    if (!room) return;
    const ok = await copyText(room.roomCode);
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 2000);
  }

  if (error && !room) {
    return (
      <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-red-200">
        {error}
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center gap-3 text-textMuted">
        <LoaderCircle className="animate-spin" />
        Loading battle room…
      </div>
    );
  }

  const players = room?.players ?? [];
  const amIHost = players.some((p) => p.isHost && p.userId === currentUserId);
  const readyCount = players.filter((p) => p.hasAnswered).length;
  const timerDanger = battleTimer.secondsLeft <= 10;
  const timerWarning =
    battleTimer.secondsLeft <= 20 && battleTimer.secondsLeft > 10;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-primary">
            {room.mode === "royale" ? "ROYALE · 1 VS MANY" : "DUEL · 1 VS 1"} ·{" "}
            {room.status.toUpperCase()}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold">
            {room.status === "waiting" ? "Battle lobby" : "Battle in progress"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {room.status === "active" && (
            <div
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 font-mono text-lg font-bold tabular-nums ${
                timerDanger
                  ? "animate-pulse border-danger/60 bg-danger/10 text-red-200"
                  : timerWarning
                    ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
                    : "border-border bg-surface text-text"
              }`}
              title={
                battleTimer.expired
                  ? "Time expired — the host should lock remaining questions"
                  : "Battle time remaining"
              }
              role="timer"
              aria-live="off"
            >
              <Timer size={18} />
              {formatBattleTime(battleTimer.secondsLeft)}
              <button
                onClick={toggleMute}
                title={muted ? "Unmute timer sounds" : "Mute timer sounds"}
                className="ml-1 rounded-md p-1 text-textMuted hover:text-text"
              >
                {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>
          )}
          <code className="rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-lg font-bold tracking-[.25em]">
            {room.roomCode}
          </code>
          <button
            onClick={() => void copyCode()}
            title="Copy battle code"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-borderHover"
          >
            {copied ? (
              <Check size={16} className="text-primary" />
            ) : (
              <Copy size={16} />
            )}
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {room.status === "waiting" && (
        <div className="mt-7 rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-textMuted">
            {players.length < room.maxPlayers
              ? `Waiting for developers to join (${players.length}/${room.maxPlayers}). Share the battle code above.`
              : "Room is full. The host can begin when ready."}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {players.map((player) => (
              <div
                key={player.userId}
                className="rounded-xl border border-border bg-background p-4"
              >
                <b>{player.username}</b>
                <span className="float-right text-primary">
                  {player.score} XP
                </span>
                <p className="mt-1 text-sm text-textMuted">
                  {player.isHost ? "Host" : "Challenger"}
                </p>
              </div>
            ))}
          </div>
          {amIHost && players.length >= 2 ? (
            <button
              onClick={() => void start()}
              disabled={busy}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-background disabled:opacity-60"
            >
              {busy ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <Swords size={17} />
              )}
              Start battle
            </button>
          ) : (
            <p className="mt-6 text-sm text-textMuted">
              {players.length < 2
                ? "Waiting for at least one opponent to join…"
                : "Waiting for the host to start the battle…"}
            </p>
          )}
        </div>
      )}

      {room.status === "active" && (
        <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-background"
              role="progressbar"
              aria-valuenow={battleTimer.secondsLeft}
              aria-valuemin={0}
              aria-valuemax={battleTimer.total}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${
                  timerDanger
                    ? "bg-danger"
                    : timerWarning
                      ? "bg-amber-400"
                      : "bg-primary"
                }`}
                style={{ width: `${battleTimer.progress * 100}%` }}
              />
            </div>

            {battleTimer.expired && (
              <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm font-semibold text-red-200">
                Time&apos;s up — the host should lock the remaining questions.
                The server decides the final result.
              </div>
            )}

            {verdictVisible && verdict && verdictForOtherQuestion && (
              <div
                className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm font-semibold ${
                  verdict.correct
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-danger/40 bg-danger/10 text-red-200"
                }`}
              >
                {verdict.correct ? (
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                ) : (
                  <XCircle size={17} className="mt-0.5 shrink-0" />
                )}
                <div>
                  Question locked ·{" "}
                  {verdict.correct ? "Correct" : "Incorrect"} · +
                  {verdict.pointsEarned} XP
                  {!verdict.correct && verdict.type !== "coding" && verdict.correctAnswer && (
                    <span className="font-normal"> — answer: {verdict.correctAnswer}</span>
                  )}
                  {verdict.type === "coding" && (
                    <span className="font-normal">
                      {" "}— {verdict.testsPassed}/{verdict.testsTotal} tests passed
                      {!verdict.correct && " · all tests required for points"}
                    </span>
                  )}
                  {!verdict.correct && verdict.type === "coding" && verdict.error && (
                    <span className="mt-1 block font-mono text-xs font-normal opacity-90">
                      {verdict.error.slice(0, 200)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {room.totalQuestions === 0 ? (
              <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-red-200">
                This battle has no questions attached. It was likely created
                before questions were enabled. Please create a fresh battle from
                the Arena.
              </div>
            ) : question ? (
              <div key={question.questionId} className="mt-4">
                <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-textMuted">
                  Question {room.currentQuestionIndex + 1} of{" "}
                  {room.totalQuestions} · {question.xpValue} XP
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                      isCoding
                        ? "bg-secondary/20 text-secondary"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {isCoding ? <Code2 size={12} /> : <ListChecks size={12} />}
                    {isCoding ? "coding" : "quiz"}
                  </span>
                </p>
                <h2 className="mt-2 text-xl font-bold">{question.prompt}</h2>

                {isCoding ? (
                  <CodingPanel
                    roomCode={room.roomCode}
                    question={question}
                    initialCode={room.myCode?.code ?? null}
                    initialLanguage={room.myCode?.language ?? null}
                    initialRun={room.myLastRun}
                    amIHost={amIHost}
                    lockBusy={lockBusy}
                    onLock={() => void lock()}
                    onError={showError}
                  />
                ) : (
                  <>
                    {question.code && (
                      <pre className="mt-4 overflow-x-auto rounded-xl bg-background p-4 font-mono text-sm">
                        {question.code}
                      </pre>
                    )}
                    <div className="mt-5 grid gap-2">
                      {options.length === 0 ? (
                        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-red-200">
                          <p>
                            This question arrived without answer options. The
                            battle server may need a restart to pick up the fix —
                            retry in a moment.
                          </p>
                          <button
                            onClick={() => void load()}
                            className="mt-3 rounded-xl border border-danger/50 px-4 py-2 text-sm font-bold text-red-100 hover:bg-danger/20"
                          >
                            Reload question
                          </button>
                        </div>
                      ) : (
                        options.map((option) => {
                          const selected = picked === option;
                          return (
                            <button
                              key={option}
                              onClick={() => void select(option)}
                              disabled={savingPick || lockBusy}
                              className={`rounded-xl border px-4 py-3 text-left font-medium transition ${
                                selected
                                  ? "border-primary/60 bg-primary/10"
                                  : "border-border hover:border-borderHover"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {amIHost ? (
                        <button
                          onClick={() => void lock()}
                          disabled={lockBusy}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-background disabled:opacity-60"
                        >
                          {lockBusy ? (
                            <LoaderCircle className="animate-spin" size={17} />
                          ) : (
                            <Lock size={17} />
                          )}
                          {lockBusy
                            ? "Locking…"
                            : `Lock question for everyone (${readyCount}/${players.length} ready)`}
                        </button>
                      ) : (
                        <p className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm text-textMuted">
                          <CircleDashed size={16} />
                          {picked
                            ? "Selected — waiting for the host to lock…"
                            : "Pick an option — the host locks for everyone."}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : questions.length === 0 ? (
              <div className="mt-4 flex items-center gap-3 text-textMuted">
                <LoaderCircle className="animate-spin" size={17} />
                Loading questions…
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3 text-textMuted">
                <LoaderCircle className="animate-spin" size={17} />
                All questions locked — tallying the final result…
              </div>
            )}
            <button
              onClick={() => void forfeit()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-textMuted hover:border-borderHover hover:text-text"
            >
              <Flag size={15} /> Forfeit
            </button>
          </div>

          <aside className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-textMuted">
              Live standings
            </p>
            <div className="mt-3 space-y-2">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div
                    key={player.userId}
                    className="flex items-center gap-3 rounded-xl bg-background p-3"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-surfaceRaised text-sm font-bold">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {player.username}{" "}
                        {player.isHost && (
                          <span className="text-textSubtle">· host</span>
                        )}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-textMuted">
                        {player.answersCount}/{room.totalQuestions} locked
                        <span
                          title={player.hasAnswered ? "Ready for lock" : "Still thinking"}
                          className={`ml-1 inline-block h-2 w-2 rounded-full ${
                            player.hasAnswered ? "bg-primary" : "bg-border"
                          }`}
                        />
                      </p>
                    </div>
                    <b className="text-sm text-primary">{player.score}</b>
                  </div>
                ))}
            </div>
            {room.status === "active" && (
              <button
                onClick={() => void load()}
                className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-textMuted hover:border-borderHover hover:text-text"
              >
                Refresh <ChevronRight size={13} />
              </button>
            )}
          </aside>
        </div>
      )}

      {(room.status === "finished" || room.status === "cancelled") && (
        <div className="mt-7 rounded-2xl border border-border bg-surface p-6 text-sm text-textMuted">
          This battle is {room.status}. Redirecting to the result…
        </div>
      )}
    </div>
  );
}
