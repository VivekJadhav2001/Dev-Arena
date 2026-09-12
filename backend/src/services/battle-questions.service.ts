import type { Difficulty } from "../utils/constants.js";

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

  // Deterministic: preferred difficulty first, then the rest in bank order.
  const preferred = BANK.filter((entry) => entry.difficulty === difficulty);
  const rest = BANK.filter((entry) => entry.difficulty !== difficulty);
  return [...preferred, ...rest].slice(0, count).map(toSeed);
}
