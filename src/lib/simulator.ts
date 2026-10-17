export interface SimulationInput {
  initialSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number; // can be auto-derived or manually set
  annualInterestRate: number; // in percent, e.g. 6%
  durationYears: number; // e.g. 5, 10, 20
  annualIncomeGrowth?: number; // in percent, e.g. 3%
  annualExpenseGrowth?: number; // in percent, e.g. 2.5%
  contributionTiming?: 'end' | 'beginning'; // ordinary annuity (end) vs annuity due (beginning)
}

export interface SimulationMonthPoint {
  month: number;
  year: number;
  label: string;
  balance: number;
  contributions: number;
  interestEarned: number;
  totalInterest: number;
  monthlyContribution: number;
}

export interface SimulationResult {
  finalBalance: number;
  totalContributions: number;
  totalInterestEarned: number;
  monthlyData: SimulationMonthPoint[];
  yearlyData: SimulationMonthPoint[];
  timeToReachGoalMonths: (targetAmount: number) => number | null;
}

/**
 * Calculates a forward financial projection with compound interest and optional growth.
 * Ordinary Annuity (contributions at end of month) is used as default standard.
 */
export function runFinancialSimulation(input: SimulationInput): SimulationResult {
  const {
    initialSavings = 0,
    monthlyIncome = 0,
    monthlyExpenses = 0,
    annualInterestRate = 0,
    durationYears = 5,
    annualIncomeGrowth = 0,
    annualExpenseGrowth = 0,
    contributionTiming = 'end',
  } = input;

  const totalMonths = Math.max(1, Math.min(600, Math.round(durationYears * 12))); // Cap at 50 years max
  const monthlyRate = Math.max(-0.99, annualInterestRate / 100 / 12);
  const incomeGrowthMonthly = Math.max(-0.5, annualIncomeGrowth / 100 / 12);
  const expenseGrowthMonthly = Math.max(-0.5, annualExpenseGrowth / 100 / 12);

  // If monthlySavings not explicitly provided, use income - expenses
  const baseMonthlyContribution =
    typeof input.monthlySavings === 'number'
      ? input.monthlySavings
      : Math.max(0, monthlyIncome - monthlyExpenses);

  const monthlyData: SimulationMonthPoint[] = [];
  const yearlyData: SimulationMonthPoint[] = [];

  let currentBalance = Math.max(0, initialSavings);
  let totalContributed = Math.max(0, initialSavings);
  let cumulativeInterest = 0;

  // Month 0 starting point
  const startPoint: SimulationMonthPoint = {
    month: 0,
    year: 0,
    label: 'Start',
    balance: Math.round(currentBalance),
    contributions: Math.round(totalContributed),
    interestEarned: 0,
    totalInterest: 0,
    monthlyContribution: 0,
  };
  monthlyData.push(startPoint);
  yearlyData.push(startPoint);

  for (let m = 1; m <= totalMonths; m++) {
    // Dynamic growth if configured
    let contributionThisMonth = baseMonthlyContribution;
    if (annualIncomeGrowth > 0 || annualExpenseGrowth > 0) {
      const curIncome = monthlyIncome * Math.pow(1 + incomeGrowthMonthly, m);
      const curExpense = monthlyExpenses * Math.pow(1 + expenseGrowthMonthly, m);
      contributionThisMonth = Math.max(0, curIncome - curExpense);
    }

    let interestThisMonth = 0;

    if (contributionTiming === 'beginning') {
      // Annuity Due: contribution earns interest in the current period
      currentBalance += contributionThisMonth;
      totalContributed += contributionThisMonth;
      interestThisMonth = currentBalance * monthlyRate;
      currentBalance += interestThisMonth;
    } else {
      // Ordinary Annuity: interest earned on existing balance, then contribution added at end
      interestThisMonth = currentBalance * monthlyRate;
      currentBalance += interestThisMonth;
      currentBalance += contributionThisMonth;
      totalContributed += contributionThisMonth;
    }

    cumulativeInterest += interestThisMonth;

    const point: SimulationMonthPoint = {
      month: m,
      year: Math.floor(m / 12),
      label: m % 12 === 0 ? `Yr ${m / 12}` : `M${m}`,
      balance: Math.round(Math.max(0, currentBalance)),
      contributions: Math.round(totalContributed),
      interestEarned: Math.round(interestThisMonth),
      totalInterest: Math.round(Math.max(0, cumulativeInterest)),
      monthlyContribution: Math.round(contributionThisMonth),
    };

    monthlyData.push(point);

    if (m % 12 === 0 || m === totalMonths) {
      yearlyData.push(point);
    }
  }

  const finalBalance = Math.round(Math.max(0, currentBalance));
  const finalContributions = Math.round(totalContributed);
  const totalInterestEarned = Math.round(Math.max(0, finalBalance - finalContributions));

  const timeToReachGoalMonths = (targetAmount: number): number | null => {
    if (targetAmount <= initialSavings) return 0;
    const found = monthlyData.find((p) => p.balance >= targetAmount);
    return found ? found.month : null;
  };

  return {
    finalBalance,
    totalContributions: finalContributions,
    totalInterestEarned,
    monthlyData,
    yearlyData,
    timeToReachGoalMonths,
  };
}
