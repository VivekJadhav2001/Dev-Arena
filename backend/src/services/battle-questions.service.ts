import type { Difficulty } from "../utils/constants.js";

export interface BattleCodingExample {
  input: string;
  output: string;
  explanation: string | null;
}

export interface BattleQuestionSeed {
  questionId: string;
  prompt: string;
  type: string;
  language: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  code: string | null;
  tags: string[];
  xpValue: number;
  // Machine-coding fields (only when type === "coding")
  statement?: string | null;
  inputDescription?: string | null;
  outputDescription?: string | null;
  constraints?: string[];
  examples?: BattleCodingExample[];
  hiddenTests?: BattleCodingExample[];
  starterCode?: string | null;
}

interface BankEntry extends Omit<BattleQuestionSeed, "language" | "xpValue"> {
  difficulty: Difficulty;
  baseXp: number;
}

const BANK: BankEntry[] = [
  {
    questionId: "array-method",
    prompt: "Which array method returns a new array after transforming each item?",
    type: "mcq",
    options: ["forEach", "map", "find", "some"],
    correctAnswer: "map",
    explanation: "map transforms every element and returns the resulting array.",
    code: null,
    tags: ["arrays"],
    difficulty: "easy",
    baseXp: 25,
  },
  {
    questionId: "strict-equality",
    prompt: "Which operator compares both value and type in JavaScript?",
    type: "mcq",
    options: ["==", "===", "=", "!="],
    correctAnswer: "===",
    explanation: "Strict equality does not coerce types.",
    code: null,
    tags: ["operators"],
    difficulty: "easy",
    baseXp: 25,
  },
  {
    questionId: "event-loop",
    prompt: "What does this code log?",
    type: "code_output",
    options: ["A, B, C", "A, C, B", "B, A, C", "C, B, A"],
    correctAnswer: "A, C, B",
    explanation: "Promise callbacks run in the microtask queue after synchronous statements.",
    code: "console.log('A')\nPromise.resolve().then(() => console.log('B'))\nconsole.log('C')",
    tags: ["async", "fundamentals"],
    difficulty: "easy",
    baseXp: 25,
  },
  {
    questionId: "typeof-null",
    prompt: "What is the result of `typeof null`?",
    type: "mcq",
    options: ["null", "undefined", "object", "string"],
    correctAnswer: "object",
    explanation: "typeof null is a long-standing language quirk that returns 'object'.",
    code: null,
    tags: ["types"],
    difficulty: "easy",
    baseXp: 25,
  },
  {
    questionId: "const-reassign",
    prompt: "What happens when you reassign a `const` variable?",
    type: "mcq",
    options: [
      "It silently keeps the old value",
      "It throws a TypeError",
      "It creates a new binding",
      "It works like `let`",
    ],
    correctAnswer: "It throws a TypeError",
    explanation: "const bindings cannot be reassigned after initialization.",
    code: null,
    tags: ["variables"],
    difficulty: "easy",
    baseXp: 25,
  },
  {
    questionId: "closure-counter",
    prompt: "What does this code log?",
    type: "code_output",
    options: ["0, 1, 2", "1, 2, 3", "3, 3, 3", "0, 0, 0"],
    correctAnswer: "0, 1, 2",
    explanation: "let is block-scoped, so each iteration captures its own value of i.",
    code: "for (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0)\n}",
    tags: ["closures", "scope"],
    difficulty: "medium",
    baseXp: 35,
  },
  {
    questionId: "promise-all",
    prompt: "How does `Promise.all` behave when one promise rejects?",
    type: "mcq",
    options: [
      "It waits for the rest, then resolves",
      "It rejects immediately with that reason",
      "It resolves with undefined entries",
      "It retries the failed promise",
    ],
    correctAnswer: "It rejects immediately with that reason",
    explanation: "Promise.all short-circuits on the first rejection.",
    code: null,
    tags: ["async", "promises"],
    difficulty: "medium",
    baseXp: 35,
  },
  {
    questionId: "spread-shallow",
    prompt: "What does `{ ...obj }` create?",
    type: "mcq",
    options: [
      "A deep clone of obj",
      "A shallow copy of obj",
      "A frozen copy of obj",
      "A reference to obj",
    ],
    correctAnswer: "A shallow copy of obj",
    explanation: "Spread copies top-level properties; nested objects stay shared.",
    code: null,
    tags: ["objects"],
    difficulty: "medium",
    baseXp: 35,
  },
  {
    questionId: "hoisting-fn",
    prompt: "What does this code log?",
    type: "code_output",
    options: ["hello", "undefined", "ReferenceError", "TypeError"],
    correctAnswer: "hello",
    explanation: "Function declarations are hoisted with their bodies.",
    code: "greet()\nfunction greet() {\n  console.log('hello')\n}",
    tags: ["hoisting", "functions"],
    difficulty: "medium",
    baseXp: 35,
  },
  {
    questionId: "this-arrow",
    prompt: "How does an arrow function resolve `this`?",
    type: "mcq",
    options: [
      "It binds its own `this` at call time",
      "It inherits `this` from the enclosing scope",
      "It always uses the global object",
      "It is always undefined",
    ],
    correctAnswer: "It inherits `this` from the enclosing scope",
    explanation: "Arrow functions capture the lexical `this` where they are defined.",
    code: null,
    tags: ["functions", "this"],
    difficulty: "medium",
    baseXp: 35,
  },
  {
    questionId: "debounce-purpose",
    prompt: "What is the primary purpose of debouncing a function?",
    type: "mcq",
    options: [
      "Run it on every event as fast as possible",
      "Delay execution until events stop firing for a wait period",
      "Run it exactly once per second",
      "Cache its return value forever",
    ],
    correctAnswer: "Delay execution until events stop firing for a wait period",
    explanation: "Debounce collapses rapid successive calls into one trailing call.",
    code: null,
    tags: ["performance", "patterns"],
    difficulty: "hard",
    baseXp: 50,
  },
  {
    questionId: "big-o-lookup",
    prompt: "What is the average time complexity of a Map key lookup?",
    type: "mcq",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: "O(1)",
    explanation: "Hash-based maps provide amortized constant-time lookups.",
    code: null,
    tags: ["complexity", "data-structures"],
    difficulty: "hard",
    baseXp: 50,
  },
  {
    questionId: "sparse-length",
    prompt: "What does this code log?",
    type: "code_output",
    options: ["2", "3", "5", "undefined"],
    correctAnswer: "5",
    explanation: "Assigning index 4 creates a sparse array whose length is the last index + 1.",
    code: "const arr = [1, 2]\narr[4] = 5\nconsole.log(arr.length)",
    tags: ["arrays", "tricky"],
    difficulty: "hard",
    baseXp: 50,
  },
  {
    questionId: "prototype-chain",
    prompt: "Where does JavaScript look when a property is missing on an object?",
    type: "mcq",
    options: [
      "It throws immediately",
      "Up the prototype chain",
      "In the global scope",
      "In a hidden class table only",
    ],
    correctAnswer: "Up the prototype chain",
    explanation: "Property lookup walks the prototype chain until Object.prototype.",
    code: null,
    tags: ["prototypes", "objects"],
    difficulty: "hard",
    baseXp: 50,
  },
  {
    questionId: "event-bubbling",
    prompt: "In which order does a click event propagate by default?",
    type: "mcq",
    options: [
      "Capturing first, then bubbling",
      "Bubbling first, then capturing",
      "Target only, no propagation",
      "Random order per browser",
    ],
    correctAnswer: "Capturing first, then bubbling",
    explanation: "Events travel down (capture), hit the target, then bubble back up.",
    code: null,
    tags: ["dom", "events"],
    difficulty: "hard",
    baseXp: 50,
  },
];

export const CODING_PER_BATTLE = 2;
export const CODING_XP = 100;

/** Generic stdin→stdout scaffolds per execution language (echoes input; players implement solve). */
const CODING_STARTERS: Record<string, string> = {
  python: `import sys

def solve() -> None:
    data = sys.stdin.read()
    # TODO: parse \`data\` and print your answer to stdout
    print(data.strip())

if __name__ == "__main__":
    solve()
`,
  javascript: `const fs = require('fs');

function solve(input) {
  // TODO: parse \`input\` and return your answer as a string
  return input.trim();
}

const input = fs.readFileSync(0, 'utf8');
process.stdout.write(String(solve(input)));
`,
  typescript: `declare const require: any;
const fs = require('fs');

function solve(input: string): string {
  // TODO: parse \`input\` and return your answer as a string
  return input.trim();
}

const input: string = fs.readFileSync(0, 'utf8');
process.stdout.write(solve(input));
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        StringBuilder sb = new StringBuilder();
        while (sc.hasNextLine()) {
            sb.append(sc.nextLine());
            if (sc.hasNextLine()) sb.append("\\n");
        }
        // TODO: solve using sb.toString() and print the answer
        System.out.print(sb.toString().trim());
        sc.close();
    }
}
`,
  go: `package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	input := strings.Join(lines, "\\n")
	// TODO: solve using input and print the answer
	fmt.Print(strings.TrimSpace(input))
}
`,
  rust: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    // TODO: solve using \`input\` and print the answer
    print!("{}", input.trim());
}
`,
};

interface CodingBankEntry {
  questionId: string;
  prompt: string;
  statement: string;
  inputDescription: string;
  outputDescription: string;
  constraints: string[];
  examples: BattleCodingExample[];
  hiddenTests: BattleCodingExample[];
  tags: string[];
}

const CODING_BANK: CodingBankEntry[] = [
  {
    questionId: "coding-two-sum",
    prompt: "Two Sum — First Pair",
    statement:
      "Given a list of integers and a target value, find the FIRST pair of distinct positions whose values add up to the target and print their 0-based indices separated by a single space. Exactly one such pair is guaranteed to exist; scan i from left to right and j > i.",
    inputDescription:
      "Line 1: space-separated integers (the array). Line 2: a single integer (the target).",
    outputDescription: "Two 0-based indices `i j` with i < j, separated by a single space.",
    constraints: ["2 ≤ n ≤ 1000", "-10^4 ≤ nums[i], target ≤ 10^4", "Exactly one valid pair exists"],
    examples: [
      { input: "2 7 11 15\n9", output: "0 1", explanation: "nums[0] + nums[1] = 2 + 7 = 9." },
      { input: "3 2 4\n6", output: "1 2", explanation: "nums[1] + nums[2] = 2 + 4 = 6." },
      { input: "1 5 3 8\n9", output: "0 3", explanation: "nums[0] + nums[3] = 1 + 8 = 9." },
    ],
    hiddenTests: [
      { input: "5 5 5\n10", output: "0 1", explanation: null },
      { input: "-1 0 1 2\n1", output: "0 3", explanation: null },
      { input: "10 20 30\n50", output: "1 2", explanation: null },
    ],
    tags: ["arrays", "hash-map"],
  },
  {
    questionId: "coding-fizzbuzz",
    prompt: "FizzBuzz Lines",
    statement:
      "Read a single integer n and print lines 1 through n with the classic substitutions: multiples of 3 become `Fizz`, multiples of 5 become `Buzz`, multiples of both become `FizzBuzz`, otherwise the number itself. One value per line, no trailing spaces.",
    inputDescription: "A single integer n.",
    outputDescription: "n lines: the FizzBuzz sequence from 1 to n.",
    constraints: ["1 ≤ n ≤ 100"],
    examples: [
      { input: "3", output: "1\n2\nFizz", explanation: null },
      { input: "5", output: "1\n2\nFizz\n4\nBuzz", explanation: "5 is a multiple of 5." },
      { input: "15", output: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", explanation: "15 is a multiple of both 3 and 5." },
    ],
    hiddenTests: [
      { input: "1", output: "1", explanation: null },
      { input: "7", output: "1\n2\nFizz\n4\nBuzz\nFizz\n7", explanation: null },
      { input: "10", output: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz", explanation: null },
    ],
    tags: ["loops", "strings"],
  },
  {
    questionId: "coding-palindrome",
    prompt: "Valid Palindrome",
    statement:
      "Read a single line of text and print `YES` if it reads the same forwards and backwards when considering only alphanumeric characters and ignoring case — otherwise print `NO`.",
    inputDescription: "A single line of text (may contain spaces and punctuation).",
    outputDescription: "Exactly `YES` or `NO`.",
    constraints: ["0 ≤ length ≤ 10^4", "Input is a single line"],
    examples: [
      { input: "Racecar", output: "YES", explanation: "Case is ignored." },
      { input: "hello", output: "NO", explanation: null },
      { input: "A man a plan a canal Panama", output: "YES", explanation: "Spaces are ignored." },
    ],
    hiddenTests: [
      { input: "a", output: "YES", explanation: null },
      { input: "ab", output: "NO", explanation: null },
      { input: "No lemon, no melon", output: "YES", explanation: null },
    ],
    tags: ["strings", "two-pointers"],
  },
];

function starterFor(language: string | null): string {
  const key = (language || "python").toLowerCase();
  return CODING_STARTERS[key] ?? CODING_STARTERS.python;
}

/** Deterministic 2-problem coding set per difficulty (always coding last). */
function pickCodingQuestions(lang: string, difficulty: Difficulty): BattleQuestionSeed[] {
  const order =
    difficulty === "easy"
      ? [CODING_BANK[1], CODING_BANK[0]]
      : difficulty === "medium"
        ? [CODING_BANK[0], CODING_BANK[2]]
        : [CODING_BANK[2], CODING_BANK[1]];
  return order.map((entry) => ({
    questionId: entry.questionId,
    prompt: entry.prompt,
    type: "coding",
    language: lang,
    options: [],
    correctAnswer: "",
    explanation: `Solved when all ${entry.examples.length + entry.hiddenTests.length} test cases pass.`,
    code: starterFor(lang),
    tags: entry.tags,
    xpValue: CODING_XP,
    statement: entry.statement,
    inputDescription: entry.inputDescription,
    outputDescription: entry.outputDescription,
    constraints: entry.constraints,
    examples: entry.examples,
    hiddenTests: entry.hiddenTests,
    starterCode: starterFor(lang),
  }));
}

/** Single source of truth for battle questions (Arena + Challenge flows share it). */
export function buildBattleQuestions(
  language: string | null,
  difficulty: Difficulty,
  count = 5,
): BattleQuestionSeed[] {
  const lang = language || "JavaScript";
  const xpFor = (entry: BankEntry) =>
    difficulty === "hard" ? entry.baseXp + 15 : difficulty === "medium" ? entry.baseXp + 10 : entry.baseXp;
  const toSeed = (entry: BankEntry): BattleQuestionSeed => ({
    questionId: entry.questionId,
    prompt: entry.prompt,
    type: entry.type,
    language: lang,
    options: entry.options,
    correctAnswer: entry.correctAnswer,
    explanation: entry.explanation,
    code: entry.code,
    tags: entry.tags,
    xpValue: xpFor(entry),
  });

  // Every battle ends with 2 machine-coding challenges (host-locked like MCQs).
  const mcqCount = Math.max(1, count - CODING_PER_BATTLE);
  // Deterministic: preferred difficulty first, then the rest in bank order.
  const preferred = BANK.filter((entry) => entry.difficulty === difficulty);
  const rest = BANK.filter((entry) => entry.difficulty !== difficulty);
  const mcq = [...preferred, ...rest].slice(0, mcqCount).map(toSeed);
  return [...mcq, ...pickCodingQuestions(lang, difficulty)];
}
