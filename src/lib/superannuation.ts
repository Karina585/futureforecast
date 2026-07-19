// Superannuation balance projection.
//
// Each year: the employer pays Super Guarantee (SG) on salary, the user can
// salary-sacrifice extra concessional contributions, and/or make
// non-concessional (after-tax) contributions. Concessional contributions
// (SG + salary sacrifice) are taxed at the flat 15% contributions tax before
// they add to the balance; non-concessional contributions are already-taxed
// money and go in at full value. The balance then grows at an assumed
// annual investment return, compounded monthly.
//
// Contribution caps are the current ATO figures (FY2024-25 onward) and are
// periodically indexed — treat them as approximate for future years. This
// does not model Division 293 tax (extra 15% on concessional contributions
// for very high income earners).

export const CONTRIBUTIONS_TAX_RATE = 0.15;
export const CONCESSIONAL_CAP = 30_000;
export const NON_CONCESSIONAL_CAP = 120_000;
/** Current SG rate — reached its legislated final step of 12% from 1 July 2025. */
export const DEFAULT_SG_RATE_PCT = 12;

export interface SuperInput {
  startingBalance: number;
  salary: number;
  sgRatePct: number;
  /** Extra concessional contributions on top of SG, e.g. salary sacrifice (annual). */
  salarySacrificeAnnual: number;
  /** After-tax contributions, no contributions tax applied (annual). */
  nonConcessionalAnnual: number;
  annualReturnPct: number;
  startDate: string; // ISO date
  maxMonths?: number;
}

export interface SuperMonthPoint {
  monthIndex: number;
  date: string;
  balance: number;
}

export interface SuperResult {
  points: SuperMonthPoint[];
  annualSgContribution: number;
  totalConcessionalAnnual: number;
  totalNonConcessionalAnnual: number;
  concessionalCapExceededBy: number;
  nonConcessionalCapExceededBy: number;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function simulateSuper(input: SuperInput): SuperResult {
  const maxMonths = input.maxMonths ?? 40 * 12;
  const monthlyReturn = input.annualReturnPct / 100 / 12;

  const annualSgContribution = input.salary * (input.sgRatePct / 100);
  const totalConcessionalAnnual = annualSgContribution + input.salarySacrificeAnnual;
  const totalNonConcessionalAnnual = input.nonConcessionalAnnual;

  const monthlyConcessionalNet =
    (totalConcessionalAnnual * (1 - CONTRIBUTIONS_TAX_RATE)) / 12;
  const monthlyNonConcessional = totalNonConcessionalAnnual / 12;

  const startDate = new Date(input.startDate);
  let balance = input.startingBalance;

  const points: SuperMonthPoint[] = [
    { monthIndex: 0, date: isoDate(startDate), balance },
  ];

  for (let m = 1; m <= maxMonths; m++) {
    balance =
      balance * (1 + monthlyReturn) + monthlyConcessionalNet + monthlyNonConcessional;
    points.push({
      monthIndex: m,
      date: isoDate(addMonths(startDate, m)),
      balance,
    });
  }

  return {
    points,
    annualSgContribution,
    totalConcessionalAnnual,
    totalNonConcessionalAnnual,
    concessionalCapExceededBy: Math.max(0, totalConcessionalAnnual - CONCESSIONAL_CAP),
    nonConcessionalCapExceededBy: Math.max(
      0,
      totalNonConcessionalAnnual - NON_CONCESSIONAL_CAP
    ),
  };
}

/** Balance at (or just past) a given number of years from the start. */
export function balanceAtYears(result: SuperResult, years: number): number {
  const targetMonth = years * 12;
  const point =
    result.points.find((p) => p.monthIndex >= targetMonth) ??
    result.points[result.points.length - 1];
  return point.balance;
}
