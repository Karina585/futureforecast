import { describe, expect, it } from "vitest";
import { requiredRepayment, simulateMortgage } from "./mortgage";

describe("requiredRepayment", () => {
  it("computes a standard P&I repayment", () => {
    // $500,000 @ 6% over 30 years
    const repayment = requiredRepayment(500_000, 6, 360);
    expect(repayment).toBeCloseTo(2997.75, 1);
  });
});

describe("simulateMortgage", () => {
  it("pays off a plain loan around its calculated term with no offset/extras", () => {
    const loanAmount = 500_000;
    const rate = 6;
    const term = 360;
    const repayment = requiredRepayment(loanAmount, rate, term);
    const result = simulateMortgage({
      loanAmount,
      annualInterestRatePct: rate,
      monthlyRepayment: repayment,
      startDate: "2026-01-01",
      offsetBalance: 0,
      events: [],
      maxMonths: 400,
    });
    expect(result.payoffMonthIndex).not.toBeNull();
    expect(result.payoffMonthIndex!).toBeGreaterThanOrEqual(term - 1);
    expect(result.payoffMonthIndex!).toBeLessThanOrEqual(term + 1);
  });

  it("pays off faster when there is an offset balance", () => {
    const loanAmount = 500_000;
    const rate = 6;
    const term = 360;
    const repayment = requiredRepayment(loanAmount, rate, term);

    const noOffset = simulateMortgage({
      loanAmount,
      annualInterestRatePct: rate,
      monthlyRepayment: repayment,
      startDate: "2026-01-01",
      offsetBalance: 0,
      events: [],
      maxMonths: 400,
    });
    const withOffset = simulateMortgage({
      loanAmount,
      annualInterestRatePct: rate,
      monthlyRepayment: repayment,
      startDate: "2026-01-01",
      offsetBalance: 100_000,
      events: [],
      maxMonths: 400,
    });

    expect(withOffset.payoffMonthIndex!).toBeLessThan(noOffset.payoffMonthIndex!);
    expect(withOffset.totalInterestPaid).toBeLessThan(noOffset.totalInterestPaid);
  });

  it("applies a one-off extra repayment into the offset account", () => {
    const result = simulateMortgage({
      loanAmount: 400_000,
      annualInterestRatePct: 6,
      monthlyRepayment: requiredRepayment(400_000, 6, 360),
      startDate: "2026-01-01",
      offsetBalance: 0,
      events: [
        {
          id: "e1",
          label: "Bonus",
          amount: 20_000,
          kind: "repayment",
          recurrence: "once",
          startDate: "2026-03-15",
        },
      ],
      maxMonths: 24,
    });
    // The event on 2026-03-15 falls in the period ending 2026-04-01.
    const point = result.points.find((p) => p.date.startsWith("2026-04"));
    expect(point?.offsetBalance).toBeCloseTo(20_000, 0);
  });

  it("applies recurring monthly extra repayments cumulatively", () => {
    const result = simulateMortgage({
      loanAmount: 400_000,
      annualInterestRatePct: 6,
      monthlyRepayment: requiredRepayment(400_000, 6, 360),
      startDate: "2026-01-01",
      offsetBalance: 0,
      events: [
        {
          id: "e1",
          label: "Extra savings",
          amount: 500,
          kind: "repayment",
          recurrence: "monthly",
          startDate: "2026-01-01",
        },
      ],
      maxMonths: 12,
    });
    const point6 = result.points[6];
    expect(point6.offsetBalance).toBeCloseTo(500 * 6, 0);
  });

  it("applies recurring quarterly extra repayments every 3 months", () => {
    const result = simulateMortgage({
      loanAmount: 400_000,
      annualInterestRatePct: 6,
      monthlyRepayment: requiredRepayment(400_000, 6, 360),
      startDate: "2026-01-01",
      offsetBalance: 0,
      events: [
        {
          id: "e1",
          label: "Quarterly bonus",
          amount: 1000,
          kind: "repayment",
          recurrence: "quarterly",
          startDate: "2026-01-01",
        },
      ],
      maxMonths: 12,
    });
    // Occurrences land at month 3, 6, 9, 12 (Jan 1 start, every 3 months).
    expect(result.points[3].offsetBalance).toBeCloseTo(1000, 0);
    expect(result.points[6].offsetBalance).toBeCloseTo(2000, 0);
    expect(result.points[12].offsetBalance).toBeCloseTo(4000, 0);
  });

  it("sweeps only what a linked contribution accumulated since the last redraw", () => {
    // Models paying quarterly RSU tax set-asides into the offset, then
    // sweeping whatever's built up to the ATO on an ad-hoc schedule.
    const result = simulateMortgage({
      loanAmount: 400_000,
      annualInterestRatePct: 6,
      monthlyRepayment: requiredRepayment(400_000, 6, 360),
      startDate: "2026-01-01",
      offsetBalance: 0,
      events: [
        {
          id: "rsu-contrib",
          label: "RSU tax set-aside",
          amount: 1000,
          kind: "repayment",
          recurrence: "quarterly",
          startDate: "2026-01-01",
        },
        {
          id: "sweep-1",
          label: "Pay ATO",
          amount: 0, // ignored: amount is auto-computed from the linked pool
          kind: "redraw",
          recurrence: "once",
          startDate: "2026-08-15",
          linkedEventId: "rsu-contrib",
        },
        {
          id: "sweep-2",
          label: "Pay ATO",
          amount: 0,
          kind: "redraw",
          recurrence: "once",
          startDate: "2026-11-15",
          linkedEventId: "rsu-contrib",
        },
      ],
      maxMonths: 12,
    });

    // By month 8 (Aug), only the Apr and Jul contributions have landed.
    expect(result.points[8].extraOut).toBeCloseTo(2000, 0);
    // By month 11 (Nov), only the Oct contribution has landed since the
    // first sweep reset the pool — not the Apr/Jul amounts again.
    expect(result.points[11].extraOut).toBeCloseTo(1000, 0);
  });

  it("reduces the offset balance on a redraw", () => {
    const result = simulateMortgage({
      loanAmount: 400_000,
      annualInterestRatePct: 6,
      monthlyRepayment: requiredRepayment(400_000, 6, 360),
      startDate: "2026-01-01",
      offsetBalance: 50_000,
      events: [
        {
          id: "r1",
          label: "Renovation",
          amount: 15_000,
          kind: "redraw",
          recurrence: "once",
          startDate: "2026-02-10",
        },
      ],
      maxMonths: 6,
    });
    // The event on 2026-02-10 falls in the period ending 2026-03-01.
    const point = result.points.find((p) => p.date.startsWith("2026-03"));
    expect(point?.offsetBalance).toBeCloseTo(35_000, 0);
  });

  it("never lets the offset balance go negative", () => {
    const result = simulateMortgage({
      loanAmount: 400_000,
      annualInterestRatePct: 6,
      monthlyRepayment: requiredRepayment(400_000, 6, 360),
      startDate: "2026-01-01",
      offsetBalance: 1_000,
      events: [
        {
          id: "r1",
          label: "Big redraw",
          amount: 10_000,
          kind: "redraw",
          recurrence: "once",
          startDate: "2026-02-10",
        },
      ],
      maxMonths: 6,
    });
    expect(result.points.every((p) => p.offsetBalance >= 0)).toBe(true);
  });
});
