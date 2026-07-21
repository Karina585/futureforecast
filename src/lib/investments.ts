// Investment (e.g. shares) balance projection.
//
// Grows at an assumed annual return, compounded monthly, and is drawn down
// by whatever the mortgage simulation reports as "sold from investments"
// each month (repayment events flagged fundedBySale) — so selling shares to
// fund a mortgage repayment, savings top-up, etc. is modelled as a transfer
// between tracked balances rather than money appearing from nowhere.

import { addMonths, isoDate } from "./dateMath";

export interface InvestmentInput {
  startingBalance: number;
  annualReturnPct: number;
  startDate: string; // ISO date
  maxMonths?: number;
}

export interface InvestmentMonthPoint {
  monthIndex: number;
  date: string;
  balance: number;
}

export interface InvestmentResult {
  points: InvestmentMonthPoint[];
}

/**
 * @param soldPerMonth Amount sold (withdrawn) in each month, indexed by
 * month number (soldPerMonth[0] is ignored — nothing is sold before the
 * simulation starts). Typically `mortgageResult.points.map(p => p.soldFromInvestments)`.
 */
export function simulateInvestments(
  input: InvestmentInput,
  soldPerMonth: number[] = []
): InvestmentResult {
  const maxMonths = input.maxMonths ?? 40 * 12;
  const monthlyReturn = input.annualReturnPct / 100 / 12;

  const startDate = new Date(input.startDate);
  let balance = input.startingBalance;

  const points: InvestmentMonthPoint[] = [
    { monthIndex: 0, date: isoDate(startDate), balance },
  ];

  for (let m = 1; m <= maxMonths; m++) {
    const sold = soldPerMonth[m] ?? 0;
    balance = Math.max(0, balance * (1 + monthlyReturn) - sold);
    points.push({
      monthIndex: m,
      date: isoDate(addMonths(startDate, m)),
      balance,
    });
  }

  return { points };
}

/** Balance at (or just past) a given number of years from the start. */
export function balanceAtYears(result: InvestmentResult, years: number): number {
  const targetMonth = years * 12;
  const point =
    result.points.find((p) => p.monthIndex >= targetMonth) ??
    result.points[result.points.length - 1];
  return point.balance;
}
