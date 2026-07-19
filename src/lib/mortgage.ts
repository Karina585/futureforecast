// Mortgage + offset account simulator.
//
// Each month: interest accrues on (loan balance - offset balance), the fixed
// repayment covers that interest first and the remainder reduces the loan
// principal. Extra repayments increase the offset balance (they don't reduce
// the loan principal directly, matching how a real offset account works);
// redraws decrease it. The loan is paid off when its balance reaches zero,
// which can happen well before the original term if the offset grows.

export type RecurrenceFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "yearly";

export interface ScheduledEvent {
  id: string;
  label: string;
  amount: number;
  kind: "repayment" | "redraw";
  recurrence: "once" | RecurrenceFrequency;
  startDate: string; // ISO date
  endDate?: string; // ISO date, only for recurring events
  /**
   * Only meaningful when kind is "redraw": the id of a "repayment" event to
   * sweep from instead of using `amount`. Each time this redraw fires it
   * withdraws everything the linked event has contributed since the last
   * withdrawal (e.g. quarterly RSU tax set-asides swept out annually to pay
   * the ATO) and resets that pool to zero.
   */
  linkedEventId?: string;
}

export interface MortgageInput {
  loanAmount: number;
  annualInterestRatePct: number;
  monthlyRepayment: number;
  startDate: string; // ISO date
  offsetBalance: number;
  events: ScheduledEvent[];
  maxMonths?: number;
}

export interface MonthPoint {
  monthIndex: number;
  date: string; // ISO date, first of month
  loanBalance: number;
  offsetBalance: number;
  interestCharged: number;
  principalPaid: number;
  extraIn: number;
  extraOut: number;
}

export interface MortgageResult {
  points: MonthPoint[];
  payoffMonthIndex: number | null;
  payoffDate: string | null;
  totalInterestPaid: number;
  originalTermMonths: number | null;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Occurrences of a recurring event that fall within (periodStart, periodEnd]. */
function occurrencesInPeriod(
  event: ScheduledEvent,
  periodStart: Date,
  periodEnd: Date
): number {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;

  if (event.recurrence === "once") {
    const d = start;
    return d > periodStart && d <= periodEnd && (!end || d <= end) ? 1 : 0;
  }

  const stepDays: Record<RecurrenceFrequency, number> = {
    weekly: 7,
    fortnightly: 14,
    monthly: 0, // handled by month arithmetic
    quarterly: 0, // handled by month arithmetic
    yearly: 0, // handled by year arithmetic
  };

  const monthlyRecurrences: RecurrenceFrequency[] = ["monthly", "quarterly", "yearly"];
  const monthSteps: Partial<Record<RecurrenceFrequency, number>> = {
    monthly: 1,
    quarterly: 3,
    yearly: 12,
  };

  let count = 0;
  if (monthlyRecurrences.includes(event.recurrence as RecurrenceFrequency)) {
    const cursor = new Date(start);
    const monthStep = monthSteps[event.recurrence as RecurrenceFrequency]!;
    // Fast-forward cursor to at or after periodStart without an unbounded loop.
    if (cursor < periodStart) {
      const monthsBetween =
        (periodStart.getFullYear() - cursor.getFullYear()) * 12 +
        (periodStart.getMonth() - cursor.getMonth());
      const steps = Math.floor(monthsBetween / monthStep);
      if (steps > 0) cursor.setMonth(cursor.getMonth() + steps * monthStep);
      while (cursor < periodStart) cursor.setMonth(cursor.getMonth() + monthStep);
    }
    while (cursor <= periodEnd) {
      if (cursor > periodStart && (!end || cursor <= end)) count++;
      cursor.setMonth(cursor.getMonth() + monthStep);
    }
  } else {
    const days = stepDays[event.recurrence];
    const cursor = new Date(start);
    if (cursor < periodStart) {
      const msBetween = periodStart.getTime() - cursor.getTime();
      const daysBetween = msBetween / 86_400_000;
      const steps = Math.floor(daysBetween / days);
      if (steps > 0) cursor.setDate(cursor.getDate() + steps * days);
      while (cursor < periodStart) cursor.setDate(cursor.getDate() + days);
    }
    while (cursor <= periodEnd) {
      if (cursor > periodStart && (!end || cursor <= end)) count++;
      cursor.setDate(cursor.getDate() + days);
    }
  }
  return count;
}

export function simulateMortgage(input: MortgageInput): MortgageResult {
  const maxMonths = input.maxMonths ?? 40 * 12;
  const monthlyRate = input.annualInterestRatePct / 100 / 12;

  let loanBalance = input.loanAmount;
  let offsetBalance = input.offsetBalance;
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
    interestCharged: 0,
    principalPaid: 0,
    extraIn: 0,
    extraOut: 0,
  });

  for (let m = 1; m <= maxMonths; m++) {
    const periodStart = addMonths(startDate, m - 1);
    const periodEnd = addMonths(startDate, m);

    let extraIn = 0;
    let extraOut = 0;

    // Contributions first, so a linked redraw in the same period sees them.
    for (const event of input.events) {
      if (event.kind !== "repayment") continue;
      const occurrences = occurrencesInPeriod(event, periodStart, periodEnd);
      if (occurrences === 0) continue;
      const total = occurrences * event.amount;
      extraIn += total;
      contributionPools[event.id] = (contributionPools[event.id] ?? 0) + total;
    }

    // Then redraws, which may sweep a linked contribution pool instead of
    // using their own fixed amount.
    for (const event of input.events) {
      if (event.kind !== "redraw") continue;
      const occurrences = occurrencesInPeriod(event, periodStart, periodEnd);
      if (occurrences === 0) continue;
      if (event.linkedEventId) {
        extraOut += contributionPools[event.linkedEventId] ?? 0;
        contributionPools[event.linkedEventId] = 0;
      } else {
        extraOut += occurrences * event.amount;
      }
    }

    offsetBalance = Math.max(0, offsetBalance + extraIn - extraOut);

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
      interestCharged: interest,
      principalPaid,
      extraIn,
      extraOut,
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
