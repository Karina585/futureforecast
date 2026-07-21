import { describe, expect, it } from "vitest";
import { requiredRepayment, simulateMortgage } from "./mortgage";
import { simulateSuper } from "./superannuation";
import { simulateInvestments } from "./investments";
import { combineNetWorth, sampleYearly } from "./netWorth";

function noInvestments(startDate: string, maxMonths: number) {
  return simulateInvestments({
    startingBalance: 0,
    annualReturnPct: 0,
    startDate,
    maxMonths,
  });
}

describe("combineNetWorth", () => {
  it("sums offset + savings + super + investments - loan at each aligned month", () => {
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
    const investments = simulateInvestments({
      startingBalance: 30_000,
      annualReturnPct: 8,
      startDate: "2026-01-01",
      maxMonths: 24,
    });

    const combined = combineNetWorth(mortgage, superResult, investments);
    expect(combined).toHaveLength(25);
    expect(combined[0].netWorth).toBeCloseTo(
      mortgage.points[0].offsetBalance +
        mortgage.points[0].savingsBalance +
        superResult.points[0].balance +
        investments.points[0].balance -
        mortgage.points[0].loanBalance,
      0
    );
    expect(combined[10].netWorth).toBeCloseTo(
      mortgage.points[10].offsetBalance +
        mortgage.points[10].savingsBalance +
        superResult.points[10].balance +
        investments.points[10].balance -
        mortgage.points[10].loanBalance,
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

    const combined = combineNetWorth(mortgage, superResult, noInvestments("2026-01-01", 24));
    const payoffIndex = mortgage.payoffMonthIndex!;
    expect(combined[combined.length - 1].netWorth).toBeGreaterThan(
      combined[payoffIndex].netWorth
    );
  });

  it("truncates to the shortest of the three series", () => {
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
    expect(
      combineNetWorth(mortgage, superResult, noInvestments("2026-01-01", 24))
    ).toHaveLength(13);
  });

  it("leaves total net worth unchanged when a sale funds a repayment (a transfer, not new money)", () => {
    const loanAmount = 400_000;
    const rate = 6;
    const repayment = requiredRepayment(loanAmount, rate, 360);
    const startDate = "2026-01-01";
    const maxMonths = 3;

    const mortgage = simulateMortgage({
      loanAmount,
      annualInterestRatePct: rate,
      monthlyRepayment: repayment,
      startDate,
      offsetBalance: 0,
      events: [
        {
          id: "e1",
          label: "Sell shares into offset",
          amount: 25_000,
          kind: "repayment",
          recurrence: "once",
          startDate: "2026-01-15",
          account: "offset",
          fundedBySale: true,
        },
      ],
      maxMonths,
    });
    const superResult = simulateSuper({
      startingBalance: 0,
      salary: 0,
      sgRatePct: 0,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 0,
      annualReturnPct: 0,
      startDate,
      maxMonths,
    });
    const investments = simulateInvestments(
      { startingBalance: 25_000, annualReturnPct: 0, startDate, maxMonths },
      mortgage.points.map((p) => p.soldFromInvestments)
    );

    const withSale = combineNetWorth(mortgage, superResult, investments);

    // The sale + contribution is a transfer between exactly two buckets
    // (investments -> offset) — their combined total shouldn't change,
    // independent of whatever the loan/interest does as a result.
    const combinedBefore = withSale[0].offsetBalance + withSale[0].investmentsBalance;
    const combinedAfter = withSale[1].offsetBalance + withSale[1].investmentsBalance;
    expect(combinedAfter).toBeCloseTo(combinedBefore, 0);
    expect(withSale[1].investmentsBalance).toBeCloseTo(0, 0);
    expect(withSale[1].offsetBalance).toBeCloseTo(25_000, 0);
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
    const yearly = sampleYearly(
      combineNetWorth(mortgage, superResult, noInvestments("2026-01-01", 36))
    );
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
    const yearly = sampleYearly(
      combineNetWorth(mortgage, superResult, noInvestments("2026-01-01", 30))
    );
    expect(yearly.map((p) => p.monthIndex)).toEqual([0, 12, 24, 30]);
  });

  it("returns an empty array for no data", () => {
    expect(sampleYearly([])).toEqual([]);
  });
});
