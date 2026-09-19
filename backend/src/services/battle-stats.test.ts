import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { outcomeFor, xpForBattle } from "./battle-stats.service.js";

describe("xpForBattle", () => {
  it("pays score plus the outcome bonus (win +50, draw +25, loss +10)", () => {
    assert.equal(xpForBattle(120, "win"), 170);
    assert.equal(xpForBattle(120, "draw"), 145);
    assert.equal(xpForBattle(120, "loss"), 130);
  });

  it("always pays the bonus, even on a scoreless battle", () => {
    assert.equal(xpForBattle(0, "loss"), 10);
  });

  it("clamps negative scores to the bare bonus", () => {
    assert.equal(xpForBattle(-40, "win"), 50);
  });
});

describe("outcomeFor", () => {
  it("reports a draw when nobody won", () => {
    const me = new mongoose.Types.ObjectId();
    assert.equal(outcomeFor(me, null), "draw");
  });

  it("reports a win only for the winner", () => {
    const me = new mongoose.Types.ObjectId();
    const rival = new mongoose.Types.ObjectId();
    assert.equal(outcomeFor(me, me), "win");
    assert.equal(outcomeFor(me, rival), "loss");
  });
});
