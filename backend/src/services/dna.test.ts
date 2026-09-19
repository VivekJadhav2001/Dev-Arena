import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { IGitHubStats } from "../models/user.model.js";
import { calculateDNA, calculateVersatility } from "./dna.service.js";

const emptyGithub = {
  totalRepos: 0,
  publicRepos: 0,
  followers: 0,
  following: 0,
  stars: 0,
  forks: 0,
  totalCommits: 0,
  languages: new Map<string, number>(),
  topLanguage: null,
  contributionStreak: 0,
  longestStreak: 0,
  mostActiveRepos: [],
  codingConsistency: null,
  openSourceScore: null,
  activityCalendar: [],
  lastSyncedAt: new Date(0),
} as unknown as IGitHubStats;

describe("calculateDNA", () => {
  it("reads a cold-start profile as The Explorer with zero coverage", () => {
    const dna = calculateDNA(emptyGithub, null, null, null, null);
    assert.equal(dna.persona, "The Explorer");
    assert.deepEqual(dna.coverage, { hasGitHub: false, hasLeetCode: false, hasBattles: false, sources: 0 });
    assert.ok(dna.personaReason.length > 0);
    assert.equal(dna.traits.length, 4);
  });

  it("is deterministic: same stats always produce the same persona and scores", () => {
    const first = calculateDNA(emptyGithub, null, null, null, null);
    const second = calculateDNA(emptyGithub, null, null, null, null);
    assert.equal(first.persona, second.persona);
    assert.deepEqual(first.scores, second.scores);
    assert.deepEqual(first.traits, second.traits);
    assert.deepEqual(first.coverage, second.coverage);
  });

  it("keeps every score inside 0-100", () => {
    const dna = calculateDNA(emptyGithub, null, null, null, null);
    for (const trait of dna.traits) {
      assert.ok(trait.score >= 0 && trait.score <= 100, `${trait.label}=${trait.score}`);
    }
  });
});

describe("calculateVersatility", () => {
  it("rewards a perfectly balanced profile with 100", () => {
    assert.equal(calculateVersatility(80, 80, 80), 100);
  });

  it("stays inside 0-100 even for lopsided profiles", () => {
    const score = calculateVersatility(100, 0, 0);
    assert.ok(score >= 0 && score <= 100);
    assert.ok(score < calculateVersatility(80, 80, 80));
  });
});
