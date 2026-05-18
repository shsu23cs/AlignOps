/**
 * Score Engine — Pure UoM scoring functions for Achievement calculation
 * All functions return a number clamped between 0.0 and 1.0.
 *
 * Formulas:
 *  NUMERIC_MIN: actual / target   (higher actual = closer to goal — minimize)
 *  NUMERIC_MAX: target / actual   (lower actual = closer to goal — maximize savings)
 *  TIMELINE:    1.0 if actual_date <= target_date, else 0.0
 *  ZERO:        1.0 if actual_value === 0, else 0.0
 */

import { UomType } from "@prisma/client";

/** Clamp value between 0 and 1 (inclusive) */
function clamp(value: number): number {
  return Math.min(1.0, Math.max(0.0, value));
}

export interface ScoreInput {
  uomType: UomType;
  target: number | null;
  targetDate: Date | null;
  actualValue: number | null;
  actualDate: Date | null;
}

/**
 * Compute score for a given UoM type.
 * Returns null if insufficient data (e.g. no actualValue provided).
 */
export function computeScore(input: ScoreInput): number | null {
  const { uomType, target, targetDate, actualValue, actualDate } = input;

  switch (uomType) {
    case UomType.NUMERIC_MIN: {
      if (actualValue === null || target === null || target === 0) return null;
      return clamp(actualValue / target);
    }

    case UomType.NUMERIC_MAX: {
      if (actualValue === null || target === null || actualValue === 0) return null;
      return clamp(target / actualValue);
    }

    case UomType.TIMELINE: {
      if (actualDate === null || targetDate === null) return null;
      // On time or early = 1.0; late = 0.0 (binary as per PRD §5)
      return actualDate <= targetDate ? 1.0 : 0.0;
    }

    case UomType.ZERO: {
      if (actualValue === null) return null;
      return actualValue === 0 ? 1.0 : 0.0;
    }

    default:
      return null;
  }
}

/**
 * Convert 0.0–1.0 score to a percentage display string (0–100).
 */
export function scoreToPercent(score: number | null): number | null {
  if (score === null) return null;
  return Math.round(score * 100);
}
