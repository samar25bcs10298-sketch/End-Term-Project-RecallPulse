/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 * 
 * Inputs:
 * - repetition: number of consecutive successful recalls (0, 1, 2, ...)
 * - easeFactor: multiplier reflecting card difficulty (default 2.5, min 1.3)
 * - interval: current interval in days before next review
 * - grade: user recall quality score (0 to 5)
 *     0: Complete blackout
 *     1: Incorrect response, but remembered upon seeing answer
 *     2: Incorrect response, where correct answer seemed easy to recall
 *     3: Correct response recalled with serious difficulty
 *     4: Correct response after hesitation
 *     5: Perfect response without hesitation
 * 
 * Returns:
 * {
 *   repetition: number,
 *   easeFactor: number,
 *   interval: number (days),
 *   nextReviewDate: Date
 * }
 */

function calculateSM2({ repetition = 0, easeFactor = 2.5, interval = 0, grade = 3 }) {
  let nextRepetition = repetition;
  let nextInterval = interval;
  let nextEaseFactor = easeFactor;

  // Ensure grade is within 0-5
  const clampedGrade = Math.max(0, Math.min(5, Math.round(grade)));

  // If grade >= 3, recall was successful
  if (clampedGrade >= 3) {
    if (repetition === 0) {
      nextInterval = 1;
    } else if (repetition === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(interval * easeFactor);
    }
    nextRepetition = repetition + 1;
  } else {
    // Failed recall: reset repetitions back to 0, review again tomorrow
    nextRepetition = 0;
    nextInterval = 1;
  }

  // Update Ease Factor (EF) formula:
  // EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  nextEaseFactor = easeFactor + (0.1 - (5 - clampedGrade) * (0.08 + (5 - clampedGrade) * 0.02));

  // Ease factor minimum floor is 1.3
  if (nextEaseFactor < 1.3) {
    nextEaseFactor = 1.3;
  }

  // Round easeFactor to 2 decimal places
  nextEaseFactor = Math.round(nextEaseFactor * 100) / 100;

  // Calculate next review timestamp
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return {
    repetition: nextRepetition,
    easeFactor: nextEaseFactor,
    interval: nextInterval,
    nextReviewDate
  };
}

module.exports = { calculateSM2 };
