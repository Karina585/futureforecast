// Mortgage + offset account simulator.
//
// Each month: interest accrues on (loan balance - offset balance), the fixed
// repayment covers that interest first and the remainder reduces the loan
// principal. Extra repayments can be routed to the offset account (don't
// reduce principal directly, matching a real offset account), straight to
// the loan principal (a permanent, non-redrawable reduction), or into a
// separate cash/savings balance that has no effect on the loan at all.
// Redraws pull money back out of the offset account or the savings balance.
// The loan is paid off when its balance reaches zero, which can happen well
// before the original term if the offset grows or principal is paid down
// directly.

import { addMonths, isoDate } from "./dateMath";
import { occurrencesInPeriod, type RecurrenceFrequency } from "./recurrence";

export type { RecurrenceFrequency };

/** Where an extra repayment's money goes, or a redraw's money comes from. */
export type FundDestination = "offset" | "principal" | "savings";

export interface ScheduledEvent {
  id: string;
  label: string;
  amount: number;
  kind: "repayment" | "redraw";
  recurrence: "once" | RecurrenceFrequency;
  startDate: string; // ISO date
  endDate?: string; // ISO date, only for recurring events
  /**
   * Which account this affects. Repayments default to "offset"; redraws
   * default to "offset" too and cannot target "principal" (a direct
   * principal payment is permanent — there's nothing left to redraw).
   */
  account?: FundDestination;
  /**
   * Only meaningful when kind is "repayment": the money is coming from
   * selling an investment rather than external income, so it's also
   * deducted from the investments balance instead of being new net worth.
   */
  fundedBySale?: boolean;
  /**
   * Only meaningful when kind is "redraw": the id of a "repayment" event to
   * sweep from instead of using `amount`. Each time this redraw fires it
   * withdraws everything the linked event has contributed since the last
   * withdrawal (e.g. quarterly RSU tax set-asides swept out annually to pay
   * the ATO) and resets that pool to zero. Only makes sense when the linked
   * event's account is "offset" or "savings" — a "principal" contribution
   * leaves nothing sitting around to withdraw.
   */
  linkedEventId?: string;
}

export interface MortgageInput {
  loanAmount: number;
  annualInterestRatePct: number;
  monthlyRepayment: number;
  startDate: string; // ISO date
  offsetBalance: number;
  startingSavingsBalance?: number;
  events: ScheduledEvent[];
  maxMonths?: number;
}

export interface MonthPoint {
  monthIndex: number;
  date: string; // ISO date, first of month
  loanBalance: number;
  offsetBalance: number;
  savingsBalance: number;
  interestCharged: number;
  principalPaid: number;
  extraIn: number;
  extraOut: number;
  /** Amount funded by selling investments this month (see fundedBySale). */
  soldFromInvestments: number;
}

export interface MortgageResult {
  points: MonthPoint[];
  payoffMonthIndex: number | null;
  payoffDate: string | null;
  totalInterestPaid: number;
  originalTermMonths: number | null;
}

export function simulateMortgage(input: MortgageInput): MortgageResult {
  const maxMonths = input.maxMonths ?? 40 * 12;
  const monthlyRate = input.annualInterestRatePct / 100 / 12;

  let loanBalance = input.loanAmount;
  let offsetBalance = input.offsetBalance;
  let savingsBalance = input.startingSavingsBalance ?? 0;
  const startDate = new Date(input.startDate);

  const points: MonthPoint[] = [];
  let payoffMonthIndex: number | null = null;
  let totalInterestPaid = 0;

  // Tracks how much each "repayment" event has contributed since it was
  // last swept by a linked redraw.
  const contributionPools: Record<string, number> = {};
  for (const event of input.events) {
    if (event.kind === "repayment") contributionPools[event.id] = 0;
  }

  points.push({
    monthIndex: 0,
    date: isoDate(startDate),
    loanBalance,
    offsetBalance,
    savingsBalance,
    interestCharged: 0,
    principalPaid: 0,
    extraIn: 0,
    extraOut: 0,
    soldFromInvestments: 0,
  });

  for (let m = 1; m <= maxMonths; m++) {
    const periodStart = addMonths(startDate, m - 1);
    const periodEnd = addMonths(startDate, m);

    let extraIn = 0;
    let extraOut = 0;
    let extraOffsetIn = 0;
    let extraSavingsIn = 0;
    let extraPrincipalPayment = 0;
    let soldFromInvestments = 0;

    // Contributions first, so a linked redraw in the same period sees them.
    for (const event of input.events) {
      if (event.kind !== "repayment") continue;
      const occurrences = occurrencesInPeriod(event, periodStart, periodEnd, m === 1);
      if (occurrences === 0) continue;
      const total = occurrences * event.amount;
      extraIn += total;
      contributionPools[event.id] = (contributionPools[event.id] ?? 0) + total;

      const account = event.account ?? "offset";
      if (account === "principal") extraPrincipalPayment += total;
      else if (account === "savings") extraSavingsIn += total;
      else extraOffsetIn += total;

      if (event.fundedBySale) soldFromInvestments += total;
    }

    let extraOffsetOut = 0;
    let extraSavingsOut = 0;

    // Then redraws, which may sweep a linked contribution pool instead of
    // using their own fixed amount.
    for (const event of input.events) {
      if (event.kind !== "redraw") continue;
      const occurrences = occurrencesInPeriod(event, periodStart, periodEnd, m === 1);
      if (occurrences === 0) continue;
      const account = event.account ?? "offset";
      const total = event.linkedEventId
        ? (contributionPools[event.linkedEventId] ?? 0)
        : occurrences * event.amount;
      if (event.linkedEventId) contributionPools[event.linkedEventId] = 0;

      extraOut += total;
      if (account === "savings") extraSavingsOut += total;
      else extraOffsetOut += total;
    }

    offsetBalance = Math.max(0, offsetBalance + extraOffsetIn - extraOffsetOut);
    savingsBalance = Math.max(0, savingsBalance + extraSavingsIn - extraSavingsOut);
    loanBalance = Math.max(0, loanBalance - extraPrincipalPayment);

    const netBalance = Math.max(0, loanBalance - offsetBalance);
    const interest = netBalance * monthlyRate;
    const repayment = Math.min(input.monthlyRepayment, loanBalance + interest);
    const principalPaid = repayment - interest;

    loanBalance = Math.max(0, loanBalance - principalPaid);
    totalInterestPaid += interest;

    points.push({
      monthIndex: m,
      date: isoDate(periodEnd),
      loanBalance,
      offsetBalance,
      savingsBalance,
      interestCharged: interest,
      principalPaid,
      extraIn,
      extraOut,
      soldFromInvestments,
    });

    if (loanBalance <= 0.01 && payoffMonthIndex === null) {
      payoffMonthIndex = m;
    }
  }

  return {
    points,
    payoffMonthIndex,
    payoffDate: payoffMonthIndex !== null ? points[payoffMonthIndex].date : null,
    totalInterestPaid,
    originalTermMonths: estimateOriginalTerm(
      input.loanAmount,
      monthlyRate,
      input.monthlyRepayment
    ),
  };
}

/** Standard amortization term (months) for the repayment with no offset/extras. */
function estimateOriginalTerm(
  principal: number,
  monthlyRate: number,
  repayment: number
): number | null {
  if (monthlyRate <= 0) {
    return repayment > 0 ? Math.ceil(principal / repayment) : null;
  }
  const interestOnlyPayment = principal * monthlyRate;
  if (repayment <= interestOnlyPayment) return null; // never pays off
  const n =
    -Math.log(1 - (principal * monthlyRate) / repayment) / Math.log(1 + monthlyRate);
  return Math.ceil(n);
}

/** Minimum repayment to fully amortize the loan over termMonths at monthlyRate. */
export function requiredRepayment(
  principal: number,
  annualInterestRatePct: number,
  termMonths: number
): number {
  const monthlyRate = annualInterestRatePct / 100 / 12;
  if (monthlyRate <= 0) return principal / termMonths;
  return (
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths))
  );
}
