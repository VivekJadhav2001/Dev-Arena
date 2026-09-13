import { CODING_LANGUAGES, type CodingLanguage } from "../utils/constants.js";
import { env } from "../config/env.js";

/**
 * Real code execution for machine-coding battle questions via Judge0 CE.
 * No local execution ever happens: player code is submitted to the Judge0
 * API with per-test stdin and validated against expected stdout. Reported
 * time/memory come from the sandbox. Failures are reported honestly —
 * never faked as passes.
 */

export interface ExecutionTestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error: string | null;
}

export interface CodeRunReport {
  testsPassed: number;
  testsTotal: number;
  allPassed: boolean;
  results: ExecutionTestResult[];
  /** Sum of sandbox-reported cpu time across tests (ms). */
  executionTimeMs: number;
  /** Max sandbox-reported memory across tests (KB), null when unavailable. */
  memoryKb: number | null;
  /** Run-wide failure (e.g. compilation failed for every test), else null. */
  error: string | null;
}

export class ExecutionError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Judge0 CE language ids (https://ce.judge0.com). */
const LANGUAGE_IDS: Record<CodingLanguage, number> = {
  python: 71,
  javascript: 63,
  typescript: 74,
  java: 62,
  go: 60,
  rust: 73,
};

const MAX_CODE_CHARS = 100_000;
const MAX_TESTS = 10;
const REQUEST_TIMEOUT_MS = 30_000;
const CPU_TIME_LIMIT_SEC = 2;
/** Stored/returned stdout is truncated — grading always compares full output first. */
const MAX_STORED_OUTPUT_CHARS = 1000;

function judgeBase(): string {
  return (env.JUDGE0_API_URL || "https://ce.judge0.com").replace(/\/$/, "");
}

export function normalizeLanguage(input: string): CodingLanguage | null {
  const key = input.trim().toLowerCase();
  if ((CODING_LANGUAGES as readonly string[]).includes(key)) return key as CodingLanguage;
  if (key === "py" || key === "python3") return "python";
  if (key === "js" || key === "node") return "javascript";
  if (key === "ts") return "typescript";
  return null;
}

export function normalizeOutput(output: string): string {
  return output.replace(/\r\n/g, "\n").trim();
}

interface JudgeSubmission {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string | null;
  memory: number | null;
  status?: { id: number; description?: string };
}

async function executeOnce(
  languageId: number,
  code: string,
  stdin: string,
): Promise<{ stdout: string; timeMs: number; memoryKb: number | null; failure: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${judgeBase()}/submissions?base64_encoded=false&wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin,
        cpu_time_limit: CPU_TIME_LIMIT_SEC,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new ExecutionError(
      502,
      err instanceof Error && err.name === "AbortError"
        ? "Code execution timed out. Please try again."
        : "Code execution service is unreachable. Your code was saved — please try Run again.",
    );
  }
  clearTimeout(timer);
  if (res.status === 429) {
    throw new ExecutionError(429, "Code execution service is busy. Wait a moment and try again.");
  }
  if (!res.ok) {
    throw new ExecutionError(502, "Code execution service returned an error. Please try again.");
  }
  const data = (await res.json()) as JudgeSubmission;
  const statusId = data.status?.id ?? 0;
  if (statusId === 5) return { stdout: "", timeMs: 0, memoryKb: null, failure: "Time limit exceeded" };
  if (statusId === 6) {
    return {
      stdout: "",
      timeMs: 0,
      memoryKb: null,
      failure: (data.compile_output || "Compilation failed.").slice(0, 2000),
    };
  }
  if (statusId !== 3 && statusId !== 4) {
    const detail = (data.stderr || data.message || data.status?.description || "Runtime error").slice(0, 1000);
    return { stdout: "", timeMs: 0, memoryKb: null, failure: detail };
  }
  return {
    stdout: data.stdout ?? "",
    timeMs: data.time != null ? Math.round(parseFloat(data.time) * 1000) : 0,
    memoryKb: typeof data.memory === "number" ? data.memory : null,
    failure: null,
  };
}

/**
 * Execute `code` against every test (stdin → expected stdout) and grade it.
 * Throws ExecutionError (502/429/400/413) on infrastructure problems —
 * callers must surface these as errors, never as passing results.
 */
export async function runTests(
  language: CodingLanguage,
  code: string,
  tests: Array<{ input: string; output: string }>,
): Promise<CodeRunReport> {
  if (!code || code.length > MAX_CODE_CHARS) {
    throw new ExecutionError(413, `Code must be 1–${MAX_CODE_CHARS} characters.`);
  }
  if (tests.length === 0 || tests.length > MAX_TESTS) {
    throw new ExecutionError(400, "Invalid test suite for this question.");
  }
  const languageId = LANGUAGE_IDS[language];

  const results = await Promise.all(
    tests.map(async (test): Promise<ExecutionTestResult & { timeMs: number; memoryKb: number | null }> => {
      try {
        const exec = await executeOnce(languageId, code, test.input);
        if (exec.failure) {
          return {
            input: test.input,
            expected: test.output,
            actual: "",
            passed: false,
            error: exec.failure,
            timeMs: 0,
            memoryKb: null,
          };
        }
        const actual = normalizeOutput(exec.stdout);
        const expected = normalizeOutput(test.output);
        return {
          input: test.input,
          expected: test.output,
          actual: (exec.stdout ?? "").slice(0, MAX_STORED_OUTPUT_CHARS),
          passed: actual === expected,
          error: null,
          timeMs: exec.timeMs,
          memoryKb: exec.memoryKb,
        };
      } catch (err) {
        if (err instanceof ExecutionError) throw err;
        throw new ExecutionError(502, "Code execution failed. Please try again.");
      }
    }),
  );

  const testsPassed = results.filter((r) => r.passed).length;
  const mems = results.map((r) => r.memoryKb).filter((m): m is number => m != null);
  // Surface a run-wide error (e.g. compile failure) only when nothing passed.
  const error = testsPassed === 0 ? (results.find((r) => r.error)?.error ?? null) : null;
  return {
    testsPassed,
    testsTotal: results.length,
    allPassed: testsPassed === results.length,
    results: results.map(({ timeMs: _t, memoryKb: _m, ...r }) => r),
    executionTimeMs: results.reduce((sum, r) => sum + r.timeMs, 0),
    memoryKb: mems.length > 0 ? Math.max(...mems) : null,
    error,
  };
}

/**
 * THE single grading rule for machine-coding, used at lock time.
 * Strict all-or-nothing (same philosophy as MCQ): every test —
 * visible AND hidden — must pass for a solve. Green always means full
 * points, red always means zero. No partial credit, no ambiguity.
 */
export function gradeCodingReport(
  report: CodeRunReport | null,
  xpValue: number,
): { isCorrect: boolean; pointsEarned: number } {
  const solved = report?.allPassed ?? false;
  return { isCorrect: solved, pointsEarned: solved ? xpValue : 0 };
}
