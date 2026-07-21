// Combines the mortgage/offset/savings simulation, the super projection,
// and the investments projection into a single net worth series:
// offset + savings + super + investments - loan. All three simulations are
// anchored to the same start date and month index, so they line up
// point-for-point.

import type { MortgageResult } from "./mortgage";
import type { SuperResult } from "./superannuation";
import type { InvestmentResult } from "./investments";

export interface NetWorthPoint {
  monthIndex: number;
  date: string;
  loanBalance: number;
  offsetBalance: number;
  savingsBalance: number;
  superBalance: number;
  investmentsBalance: number;
  netWorth: number;
}

export function combineNetWorth(
  mortgage: MortgageResult,
  superResult: SuperResult,
  investments: InvestmentResult
): NetWorthPoint[] {
  const length = Math.min(
    mortgage.points.length,
    superResult.points.length,
    investments.points.length
  );
  const points: NetWorthPoint[] = [];
  for (let i = 0; i < length; i++) {
    const m = mortgage.points[i];
    const s = superResult.points[i];
    const inv = investments.points[i];
    points.push({
      monthIndex: m.monthIndex,
      date: m.date,
      loanBalance: m.loanBalance,
      offsetBalance: m.offsetBalance,
      savingsBalance: m.savingsBalance,
      superBalance: s.balance,
      investmentsBalance: inv.balance,
      netWorth: m.offsetBalance + m.savingsBalance + s.balance + inv.balance - m.loanBalance,
    });
  }
  return points;
}

/** One point per year (every 12 months from the start), always including the final point. */
export function sampleYearly(points: NetWorthPoint[]): NetWorthPoint[] {
  if (points.length === 0) return [];
  const sampled = points.filter((p) => p.monthIndex % 12 === 0);
  const last = points[points.length - 1];
  if (sampled[sampled.length - 1]?.monthIndex !== last.monthIndex) {
    sampled.push(last);
  }
  return sampled;
}
