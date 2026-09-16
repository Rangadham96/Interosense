import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { normalizeMaia2Submission } from "../assessmentValidation";
import { MAIA2_REQUIRED_SUBSCALE_KEYS } from "../../constants/clinical-scales";

describe("normalizeMaia2Submission", () => {
  it("accepts an older-client submission with 37 valid raw answers", () => {
    const result = normalizeMaia2Submission(new Array(37).fill(3));

    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.answers.length, 37);
    assert.deepEqual(
      Object.keys(result.subscaleScores).sort(),
      [...MAIA2_REQUIRED_SUBSCALE_KEYS].sort(),
    );
    assert.ok(result.totalScore >= 0 && result.totalScore <= 100);
  });

  it("recalculates reverse-scored subscales from raw answers", () => {
    const low = normalizeMaia2Submission(new Array(37).fill(0));
    const high = normalizeMaia2Submission(new Array(37).fill(5));

    assert.equal(low.ok, true);
    assert.equal(high.ok, true);
    if (!low.ok || !high.ok) return;

    // Not Distracting and Not Worrying contain reverse-scored questions.
    assert.notEqual(
      low.subscaleScores.notDistracting,
      high.subscaleScores.notDistracting,
    );
  });

  it("rejects partial answers instead of manufacturing missing values", () => {
    const result = normalizeMaia2Submission(new Array(36).fill(3));
    assert.deepEqual(result, {
      ok: false,
      message: "MAIA-2 assessment must contain exactly 37 answers from 0 to 5",
    });
  });

  it("rejects out-of-range, fractional, and non-numeric answers", () => {
    for (const invalid of [6, -1, 2.5, "3", null]) {
      const answers = new Array<unknown>(37).fill(3);
      answers[10] = invalid;
      assert.equal(normalizeMaia2Submission(answers).ok, false);
    }
  });
});