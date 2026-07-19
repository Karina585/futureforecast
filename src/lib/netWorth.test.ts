import { describe, expect, it } from "vitest";
import { requiredRepayment, simulateMortgage } from "./mortgage";
import { simulateSuper } from "./superannuation";
import { combineNetWorth, sampleYearly } from "./netWorth";

describe("combineNetWorth", () => {
  it("sums offset + super - loan at each aligned month", () => {
    const mortgage = simulateMortgage({
      loanAmount: 400_000,
      annualInterestRatePct: 6,
      monthlyRepayment: requiredRepayment(400_000, 6, 360),
      startDate: "2026-01-01",
      offsetBalance: 20_000,
      events: [],
      maxMonths: 24,
    });
    const superResult = simulateSuper({
      startingBalance: 50_000,
      salary: 100_000,
      sgRatePct: 12,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 0,
      annualReturnPct: 7,
      startDate: "2026-01-01",
      maxMonths: 24,
    });

    const combined = combineNetWorth(mortgage, superResult);
    expect(combined).toHaveLength(25);
    expect(combined[0].netWorth).toBeCloseTo(
      mortgage.points[0].offsetBalance + superResult.points[0].balance - mortgage.points[0].loanBalance,
      0
    );
    expect(combined[10].netWorth).toBeCloseTo(
      mortgage.points[10].offsetBalance + superResult.points[10].balance - mortgage.points[10].loanBalance,
      0
    );
  });

  it("keeps growing via super after the loan is paid off", () => {
    const mortgage = simulateMortgage({
      loanAmount: 10_000,
      annualInterestRatePct: 6,
      monthlyRepayment: requiredRepayment(10_000, 6, 24),
      startDate: "2026-01-01",
      offsetBalance: 50_000,
      events: [],
      maxMonths: 24,
    });
    const superResult = simulateSuper({
      startingBalance: 50_000,
      salary: 100_000,
      sgRatePct: 12,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 0,
      annualReturnPct: 7,
      startDate: "2026-01-01",
      maxMonths: 24,
    });

    const combined = combineNetWorth(mortgage, superResult);
    const payoffIndex = mortgage.payoffMonthIndex!;
    expect(combined[combined.length - 1].netWorth).toBeGreaterThan(
      combined[payoffIndex].netWorth
    );
  });

  it("truncates to the shorter of the two series", () => {
    const mortgage = simulateMortgage({
      loanAmount: 400_000,
      annualInterestRatePct: 6,
      monthlyRepayment: requiredRepayment(400_000, 6, 360),
      startDate: "2026-01-01",
      offsetBalance: 20_000,
      events: [],
      maxMonths: 24,
    });
    const superResult = simulateSuper({
      startingBalance: 50_000,
      salary: 100_000,
      sgRatePct: 12,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 0,
      annualReturnPct: 7,
      startDate: "2026-01-01",
      maxMonths: 12,
    });
    expect(combineNetWorth(mortgage, superResult)).toHaveLength(13);
  });
});

describe("sampleYearly", () => {
  it("keeps one point per 12 months", () => {
    const mortgage = simulateMortgage({
      loanAmount: 400_000,
      annualInterestRatePct: 6,
      monthlyRepayment: requiredRepayment(400_000, 6, 360),
      startDate: "2026-01-01",
      offsetBalance: 20_000,
      events: [],
      maxMonths: 36,
    });
    const superResult = simulateSuper({
      startingBalance: 50_000,
      salary: 100_000,
      sgRatePct: 12,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 0,
      annualReturnPct: 7,
      startDate: "2026-01-01",
      maxMonths: 36,
    });
    const yearly = sampleYearly(combineNetWorth(mortgage, superResult));
    expect(yearly.map((p) => p.monthIndex)).toEqual([0, 12, 24, 36]);
  });

  it("always includes the final point even off the 12-month boundary", () => {
    const mortgage = simulateMortgage({
      loanAmount: 400_000,
      annualInterestRatePct: 6,
      monthlyRepayment: requiredRepayment(400_000, 6, 360),
      startDate: "2026-01-01",
      offsetBalance: 20_000,
      events: [],
      maxMonths: 30,
    });
    const superResult = simulateSuper({
      startingBalance: 50_000,
      salary: 100_000,
      sgRatePct: 12,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 0,
      annualReturnPct: 7,
      startDate: "2026-01-01",
      maxMonths: 30,
    });
    const yearly = sampleYearly(combineNetWorth(mortgage, superResult));
    expect(yearly.map((p) => p.monthIndex)).toEqual([0, 12, 24, 30]);
  });

  it("returns an empty array for no data", () => {
    expect(sampleYearly([])).toEqual([]);
  });
});
