import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateRoomCode,
  getLevelFromXp,
  getXpForLevel,
  getXpProgress,
} from "./constants.js";

describe("XP curve", () => {
  it("starts every developer at level 1 with zero XP", () => {
    assert.equal(getXpForLevel(1), 0);
    assert.equal(getLevelFromXp(0), 1);
  });

  it("uses the 50 * level * (level - 1) thresholds", () => {
    assert.equal(getXpForLevel(2), 100);
    assert.equal(getXpForLevel(3), 300);
    assert.equal(getXpForLevel(4), 600);
  });

  it("levels up exactly on a threshold and never below it", () => {
    assert.equal(getLevelFromXp(99), 1);
    assert.equal(getLevelFromXp(100), 2);
    assert.equal(getLevelFromXp(299), 2);
    assert.equal(getLevelFromXp(300), 3);
  });

  it("treats negative XP as level 1", () => {
    assert.equal(getLevelFromXp(-50), 1);
  });

  it("round-trips: a threshold always maps back to its level", () => {
    for (let level = 1; level <= 20; level += 1) {
      assert.equal(getLevelFromXp(getXpForLevel(level)), level);
    }
  });

  it("reports progress inside [0, 1) with a matching level", () => {
    const progress = getXpProgress(150);
    assert.equal(progress.currentLevel, 2);
    assert.ok(progress.progress >= 0 && progress.progress < 1);
    assert.equal(progress.currentLevelXp, 50);
    assert.equal(progress.nextLevelXp, 200);
  });
});

describe("generateRoomCode", () => {
  it("produces 6-char codes from the join alphabet", () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateRoomCode();
      assert.match(code, /^[A-Z0-9]{6}$/);
    }
  });

  it("does not repeat itself across a burst of rooms", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateRoomCode()));
    assert.ok(codes.size > 45);
  });
});
