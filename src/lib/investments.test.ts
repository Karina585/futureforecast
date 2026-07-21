import { describe, expect, it } from "vitest";
import { balanceAtYears, simulateInvestments } from "./investments";

describe("simulateInvestments", () => {
  it("compounds the starting balance at the given monthly return with no sales", () => {
    const result = simulateInvestments({
      startingBalance: 100_000,
      annualReturnPct: 12, // 1%/mo for easy math
      startDate: "2026-01-01",
      maxMonths: 12,
    });
    expect(result.points[1].balance).toBeCloseTo(101_000, 0);
    expect(result.points[12].balance).toBeGreaterThan(100_000);
  });

  it("reduces the balance by sales in the month they occur", () => {
    const soldPerMonth = [0, 0, 20_000, 0, 0];
    const result = simulateInvestments(
      {
        startingBalance: 100_000,
        annualReturnPct: 0,
        startDate: "2026-01-01",
        maxMonths: 4,
      },
      soldPerMonth
    );
    expect(result.points[1].balance).toBeCloseTo(100_000, 0);
    expect(result.points[2].balance).toBeCloseTo(80_000, 0);
    expect(result.points[3].balance).toBeCloseTo(80_000, 0);
  });

  it("never goes negative even if sales exceed the balance", () => {
    const soldPerMonth = [0, 200_000];
    const result = simulateInvestments(
      {
        startingBalance: 100_000,
        annualReturnPct: 0,
        startDate: "2026-01-01",
        maxMonths: 1,
      },
      soldPerMonth
    );
    expect(result.points[1].balance).toBe(0);
  });

  it("defaults to no sales when soldPerMonth is omitted", () => {
    const result = simulateInvestments({
      startingBalance: 50_000,
      annualReturnPct: 0,
      startDate: "2026-01-01",
      maxMonths: 6,
    });
    expect(result.points[6].balance).toBeCloseTo(50_000, 0);
  });
});

describe("balanceAtYears", () => {
  it("finds the balance at approximately the given number of years", () => {
    const result = simulateInvestments({
      startingBalance: 50_000,
      annualReturnPct: 8,
      startDate: "2026-01-01",
      maxMonths: 480,
    });
    const at10 = balanceAtYears(result, 10);
    const at20 = balanceAtYears(result, 20);
    expect(at20).toBeGreaterThan(at10);
  });
});
