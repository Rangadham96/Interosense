import {
  calculateMaia2Subscales,
  getMaia2OverallAverage,
} from "../constants/clinical-scales";

export type Maia2SubmissionResult =
  | {
      ok: true;
      answers: number[];
      subscaleScores: Record<string, number>;
      totalScore: number;
    }
  | {
      ok: false;
      message: string;
    };

/**
 * Treat the 37 raw answers as the source of truth.
 *
 * Older clients did not send subscaleScores, while newer clients calculate
 * them locally. Computing them again on the server preserves valid legacy
 * submissions and prevents incomplete/tampered summaries from being stored.
 */
export function normalizeMaia2Submission(answers: unknown): Maia2SubmissionResult {
  if (
    !Array.isArray(answers) ||
    answers.length !== 37 ||
    answers.some(answer =>
      typeof answer !== "number" ||
      !Number.isInteger(answer) ||
      answer < 0 ||
      answer > 5
    )
  ) {
    return {
      ok: false,
      message: "MAIA-2 assessment must contain exactly 37 answers from 0 to 5",
    };
  }

  const validatedAnswers = answers as number[];
  const subscaleScores = calculateMaia2Subscales(validatedAnswers);
  const totalScore = Math.round(getMaia2OverallAverage(subscaleScores) * 20);

  return {
    ok: true,
    answers: validatedAnswers,
    subscaleScores,
    totalScore,
  };
}