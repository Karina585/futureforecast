import { describe, expect, it } from "vitest";
import { calculateAuTax } from "./auTax";

describe("calculateAuTax", () => {
  it("charges no tax below the tax-free threshold", () => {
    const result = calculateAuTax({ grossIncome: 15_000, taxYear: "2024-25" });
    expect(result.incomeTax).toBe(0);
    expect(result.medicareLevy).toBe(0);
    expect(result.netIncome).toBe(15_000);
  });

  it("matches the known 2024-25 tax on $100,000", () => {
    // 4288 + 30% of (100000-45000) = 4288 + 16500 = 20788 gross tax, LITO 0 above 66,667
    const result = calculateAuTax({ grossIncome: 100_000, taxYear: "2024-25" });
    expect(result.incomeTax).toBeCloseTo(20_788, 0);
    expect(result.medicareLevy).toBeCloseTo(2_000, 0);
  });

  it("applies the reduced 15% rate from 2026-27", () => {
    const a = calculateAuTax({ grossIncome: 40_000, taxYear: "2025-26" });
    const b = calculateAuTax({ grossIncome: 40_000, taxYear: "2026-27" });
    expect(b.incomeTax).toBeLessThan(a.incomeTax);
  });

  it("applies LITO for middle incomes", () => {
    const result = calculateAuTax({ grossIncome: 40_000, taxYear: "2024-25" });
    // gross tax = (40000-18200)*0.16 = 3488, LITO is full 700 below 37500 but
    // partially reduced here: 700 - (40000-37500)*0.05 = 575
    expect(result.lito).toBeCloseTo(575, 0);
    expect(result.incomeTax).toBeCloseTo(3488 - 575, 0);
  });

  it("adds HELP repayment only when the debt flag is set", () => {
    const withHelp = calculateAuTax({
      grossIncome: 80_000,
      taxYear: "2024-25",
      hasHelpDebt: true,
    });
    const withoutHelp = calculateAuTax({ grossIncome: 80_000, taxYear: "2024-25" });
    expect(withHelp.helpRepayment).toBeGreaterThan(0);
    expect(withoutHelp.helpRepayment).toBe(0);
    expect(withHelp.totalTax).toBeGreaterThan(withoutHelp.totalTax);
  });

  it("adds Medicare levy surcharge only without private cover above threshold", () => {
    const noCover = calculateAuTax({
      grossIncome: 120_000,
      taxYear: "2024-25",
      hasPrivateHealthCover: false,
    });
    const withCover = calculateAuTax({
      grossIncome: 120_000,
      taxYear: "2024-25",
      hasPrivateHealthCover: true,
    });
    expect(noCover.medicareLevySurcharge).toBeGreaterThan(0);
    expect(withCover.medicareLevySurcharge).toBe(0);
  });

  it("reduces taxable income by salary packaging", () => {
    const result = calculateAuTax({
      grossIncome: 90_000,
      taxYear: "2024-25",
      salaryPackaging: 10_000,
    });
    expect(result.taxableIncome).toBe(80_000);
  });

  it("computes net pay period breakdowns", () => {
    const result = calculateAuTax({ grossIncome: 104_000, taxYear: "2024-25" });
    expect(result.netWeekly * 52).toBeCloseTo(result.netIncome, 6);
    expect(result.netFortnightly * 26).toBeCloseTo(result.netIncome, 6);
    expect(result.netMonthly * 12).toBeCloseTo(result.netIncome, 6);
  });
});
