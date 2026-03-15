// ─── Goal Calculator Utility ────────────────────────────────────────────────
// Uses mathematical formulas for accurate SIP and goal tracking

interface GoalInput {
  targetAmount: number;
  years: number;
  expectedReturn: number; // e.g., 12 for 12%
  initialLumpSum?: number;
}

interface YearlyAdjustmentInput {
  currentCorpus: number;
  extraSavings: number;
  actualYearlyReturn: number;
  remainingYears: number;
  finalTarget: number;
}

interface YearlyAdjustmentResult {
  updatedCorpus: number;
  newRequiredSIP: number;
}

/**
 * Calculate the required monthly SIP (Systematic Investment Plan) amount
 * Based on the formula: FV = P × ((1 + i)^n - 1) / i × (1 + i)
 * Where:
 * - FV = Future Value (Target Amount)
 * - P = Monthly SIP amount
 * - i = Periodic interest rate (Annual rate / 12)
 * - n = Number of payments (Months)
 */
export const calculateRequiredSIP = ({
  targetAmount,
  years,
  expectedReturn,
  initialLumpSum = 0,
}: GoalInput): number => {
  const months = years * 12;
  const monthlyRate = expectedReturn / 100 / 12;

  // Handle zero interest rate
  if (monthlyRate === 0) {
    const remainingTarget = targetAmount - initialLumpSum;
    return Math.round(remainingTarget / months);
  }

  // Adjust target by the growth of the initial lump sum
  const futureValueOfLumpSum =
    initialLumpSum * Math.pow(1 + monthlyRate, months);
  const remainingTarget = targetAmount - futureValueOfLumpSum;

  if (remainingTarget <= 0) return 0;

  // Formula to find 'P' (Monthly Installment)
  const sipAmount =
    (remainingTarget * monthlyRate) /
    ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate));

  return Math.round(sipAmount);
};

/**
 * Calculate the future value of a goal at any point in time
 * Shows how much the investment will grow based on contributions and returns
 */
export const calculateFutureValue = (
  monthlyContribution: number,
  months: number,
  annualRate: number,
  lumpSum: number = 0,
): number => {
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return lumpSum + monthlyContribution * months;
  }

  // Future value of lump sum
  const fvLumpSum = lumpSum * Math.pow(1 + monthlyRate, months);

  // Future value of monthly investments (annuity formula)
  const fvAnnuity =
    monthlyContribution *
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  return Math.round(fvLumpSum + fvAnnuity);
};

/**
 * Track the growth month by month for a more detailed view
 * Returns an array showing corpus value at each month
 */
export const simulateGoalProgress = (
  monthlyContribution: number,
  totalMonths: number,
  annualRate: number,
  lumpSum: number = 0,
): { month: number; corpus: number }[] => {
  const monthlyRate = annualRate / 100 / 12;
  const progress: { month: number; corpus: number }[] = [];

  let corpus = lumpSum;

  for (let month = 0; month <= totalMonths; month++) {
    progress.push({
      month,
      corpus: Math.round(corpus),
    });

    if (month < totalMonths) {
      // Apply return first, then add contribution
      corpus = corpus * (1 + monthlyRate) + monthlyContribution;
    }
  }

  return progress;
};

/**
 * Adjust goal progress based on actual year-end results
 * Recalculates required SIP based on actual performance and extra savings
 */
export const adjustGoalProgress = ({
  currentCorpus,
  extraSavings,
  actualYearlyReturn,
  remainingYears,
  finalTarget,
}: YearlyAdjustmentInput): YearlyAdjustmentResult => {
  // 1. Grow current corpus by actual return + add extra savings
  const updatedCorpus =
    currentCorpus * (1 + actualYearlyReturn / 100) + extraSavings;

  // 2. Re-calculate required SIP for remaining time
  const newRequiredSIP = calculateRequiredSIP({
    targetAmount: finalTarget,
    years: remainingYears,
    expectedReturn: actualYearlyReturn,
    initialLumpSum: updatedCorpus,
  });

  return {
    updatedCorpus,
    newRequiredSIP,
  };
};

/**
 * Calculate how much time is needed to reach a target at current rate
 */
export const calculateTimeToTarget = (
  currentCorpus: number,
  monthlyContribution: number,
  annualRate: number,
  targetAmount: number,
): number => {
  const monthlyRate = annualRate / 100 / 12;
  let corpus = currentCorpus;
  let months = 0;

  // Cap at 360 months (30 years) to prevent infinite loops
  while (corpus < targetAmount && months < 360) {
    corpus = corpus * (1 + monthlyRate) + monthlyContribution;
    months++;
  }

  return Math.ceil(months / 12); // Convert to years
};

/**
 * Get a detailed breakdown of goal progress
 */
export interface GoalProgress {
  currentValue: number;
  targetValue: number;
  percentageComplete: number;
  monthsElapsed: number;
  monthsRemaining: number;
  projectedValue: number;
  isOnTrack: boolean;
}

export const calculateGoalProgress = (
  currentCorpus: number,
  monthlyContribution: number,
  targetAmount: number,
  monthsElapsed: number,
  totalMonths: number,
  annualRate: number,
): GoalProgress => {
  const monthsRemaining = totalMonths - monthsElapsed;
  const projectedValue = calculateFutureValue(
    monthlyContribution,
    monthsRemaining,
    annualRate,
    currentCorpus,
  );

  return {
    currentValue: currentCorpus,
    targetValue: targetAmount,
    percentageComplete: (currentCorpus / targetAmount) * 100,
    monthsElapsed,
    monthsRemaining,
    projectedValue,
    isOnTrack: projectedValue >= targetAmount,
  };
};

export default {};
