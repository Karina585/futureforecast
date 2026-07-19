import { describe, expect, it } from "vitest";
import { balanceAtYears, simulateSuper } from "./superannuation";

describe("simulateSuper", () => {
  it("grows the balance from SG contributions net of the 15% contributions tax", () => {
    const result = simulateSuper({
      startingBalance: 0,
      salary: 100_000,
      sgRatePct: 12,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 0,
      annualReturnPct: 0, // isolate contributions from investment growth
      startDate: "2026-01-01",
      maxMonths: 12,
    });
    expect(result.annualSgContribution).toBeCloseTo(12_000, 0);
    // 12,000 * 0.85 net of contributions tax, accrued over 12 months.
    expect(result.points[12].balance).toBeCloseTo(12_000 * 0.85, 0);
  });

  it("adds non-concessional contributions at full value, no contributions tax", () => {
    const result = simulateSuper({
      startingBalance: 0,
      salary: 0,
      sgRatePct: 12,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 12_000,
      annualReturnPct: 0,
      startDate: "2026-01-01",
      maxMonths: 12,
    });
    expect(result.points[12].balance).toBeCloseTo(12_000, 0);
  });

  it("compounds investment returns on top of contributions", () => {
    const withReturn = simulateSuper({
      startingBalance: 100_000,
      salary: 0,
      sgRatePct: 0,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 0,
      annualReturnPct: 7,
      startDate: "2026-01-01",
      maxMonths: 120,
    });
    const noReturn = simulateSuper({
      startingBalance: 100_000,
      salary: 0,
      sgRatePct: 0,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 0,
      annualReturnPct: 0,
      startDate: "2026-01-01",
      maxMonths: 120,
    });
    expect(withReturn.points[120].balance).toBeGreaterThan(noReturn.points[120].balance);
    expect(noReturn.points[120].balance).toBeCloseTo(100_000, 0);
  });

  it("flags when concessional contributions exceed the cap", () => {
    const overCap = simulateSuper({
      startingBalance: 0,
      salary: 250_000,
      sgRatePct: 12,
      salarySacrificeAnnual: 5_000,
      nonConcessionalAnnual: 0,
      annualReturnPct: 0,
      startDate: "2026-01-01",
    });
    // SG = 30,000, + 5,000 sacrifice = 35,000, cap is 30,000.
    expect(overCap.totalConcessionalAnnual).toBeCloseTo(35_000, 0);
    expect(overCap.concessionalCapExceededBy).toBeCloseTo(5_000, 0);
  });

  it("flags when non-concessional contributions exceed the cap", () => {
    const overCap = simulateSuper({
      startingBalance: 0,
      salary: 100_000,
      sgRatePct: 12,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 130_000,
      annualReturnPct: 0,
      startDate: "2026-01-01",
    });
    expect(overCap.nonConcessionalCapExceededBy).toBeCloseTo(10_000, 0);
  });

  it("reports no cap breach when contributions stay within limits", () => {
    const result = simulateSuper({
      startingBalance: 0,
      salary: 100_000,
      sgRatePct: 12,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 0,
      annualReturnPct: 0,
      startDate: "2026-01-01",
    });
    expect(result.concessionalCapExceededBy).toBe(0);
    expect(result.nonConcessionalCapExceededBy).toBe(0);
  });
});

describe("balanceAtYears", () => {
  it("finds the balance at approximately the given number of years", () => {
    const result = simulateSuper({
      startingBalance: 50_000,
      salary: 100_000,
      sgRatePct: 12,
      salarySacrificeAnnual: 0,
      nonConcessionalAnnual: 0,
      annualReturnPct: 7,
      startDate: "2026-01-01",
      maxMonths: 480,
    });
    const at10 = balanceAtYears(result, 10);
    const at20 = balanceAtYears(result, 20);
    expect(at20).toBeGreaterThan(at10);
  });
});
