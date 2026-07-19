// Australian resident individual income tax.
//
// Bracket rates are legislated in advance so are reliable years ahead; the
// Medicare levy low-income thresholds and the HELP repayment thresholds are
// indexed annually by the ATO and only the most recently published figures
// are used here — treat those two as approximate for future years.

export type TaxYear = "2024-25" | "2025-26" | "2026-27" | "2027-28";

export const TAX_YEARS: TaxYear[] = ["2024-25", "2025-26", "2026-27", "2027-28"];

interface Bracket {
  min: number;
  max: number | null;
  rate: number;
}

// Resident individual tax brackets. The 18,200-45,000 rate steps down from
// 16% -> 15% (1 Jul 2026) -> 14% (1 Jul 2027) under the Treasury Laws
// Amendment (Tax Cuts to Build Prosperity for Working Australians) Act 2025.
// 2027-28 rates are held flat for any later year since nothing further is
// legislated yet.
const BRACKETS: Record<TaxYear, Bracket[]> = {
  "2024-25": [
    { min: 0, max: 18_200, rate: 0 },
    { min: 18_200, max: 45_000, rate: 0.16 },
    { min: 45_000, max: 135_000, rate: 0.3 },
    { min: 135_000, max: 190_000, rate: 0.37 },
    { min: 190_000, max: null, rate: 0.45 },
  ],
  "2025-26": [
    { min: 0, max: 18_200, rate: 0 },
    { min: 18_200, max: 45_000, rate: 0.16 },
    { min: 45_000, max: 135_000, rate: 0.3 },
    { min: 135_000, max: 190_000, rate: 0.37 },
    { min: 190_000, max: null, rate: 0.45 },
  ],
  "2026-27": [
    { min: 0, max: 18_200, rate: 0 },
    { min: 18_200, max: 45_000, rate: 0.15 },
    { min: 45_000, max: 135_000, rate: 0.3 },
    { min: 135_000, max: 190_000, rate: 0.37 },
    { min: 190_000, max: null, rate: 0.45 },
  ],
  "2027-28": [
    { min: 0, max: 18_200, rate: 0 },
    { min: 18_200, max: 45_000, rate: 0.14 },
    { min: 45_000, max: 135_000, rate: 0.3 },
    { min: 135_000, max: 190_000, rate: 0.37 },
    { min: 190_000, max: null, rate: 0.45 },
  ],
};

/** Resolves any year beyond the table to the latest known rates. */
function bracketsFor(year: TaxYear): Bracket[] {
  return BRACKETS[year] ?? BRACKETS["2027-28"];
}

function taxOnBrackets(income: number, brackets: Bracket[]): number {
  let tax = 0;
  for (const b of brackets) {
    if (income <= b.min) break;
    const top = b.max ?? Infinity;
    const taxableInBand = Math.min(income, top) - b.min;
    tax += taxableInBand * b.rate;
  }
  return tax;
}

/** Low Income Tax Offset — stable since 2020-21, applied after gross tax. */
function lito(income: number): number {
  if (income <= 37_500) return 700;
  if (income <= 45_000) return Math.max(0, 700 - (income - 37_500) * 0.05);
  if (income <= 66_667) return Math.max(0, 325 - (income - 45_000) * 0.015);
  return 0;
}

// 2024-25 figures (single, no dependents); indexed annually by the ATO.
const MEDICARE_LOW_INCOME_THRESHOLD = 26_000;
const MEDICARE_PHASE_IN_LIMIT = 32_500;
const MEDICARE_RATE = 0.02;

function medicareLevy(income: number): number {
  if (income <= MEDICARE_LOW_INCOME_THRESHOLD) return 0;
  if (income <= MEDICARE_PHASE_IN_LIMIT) {
    return (income - MEDICARE_LOW_INCOME_THRESHOLD) * 0.1;
  }
  return income * MEDICARE_RATE;
}

// Medicare Levy Surcharge (singles, 2024-25 thresholds). Only relevant if
// the person has no private hospital cover.
const MLS_BRACKETS = [
  { min: 0, max: 97_000, rate: 0 },
  { min: 97_000, max: 113_000, rate: 0.01 },
  { min: 113_000, max: 151_000, rate: 0.0125 },
  { min: 151_000, max: null, rate: 0.015 },
];

function medicareLevySurcharge(income: number): number {
  const bracket = MLS_BRACKETS.find(
    (b) => income > b.min && (b.max === null || income <= b.max)
  );
  return bracket ? income * bracket.rate : 0;
}

// 2024-25 HELP/HECS repayment thresholds (marginal-style since 2025-26
// reforms; approximated here as a simple marginal schedule).
const HELP_BRACKETS = [
  { min: 0, max: 54_435, rate: 0 },
  { min: 54_435, max: 62_850, rate: 0.01 },
  { min: 62_850, max: 66_620, rate: 0.02 },
  { min: 66_620, max: 70_618, rate: 0.025 },
  { min: 70_618, max: 74_855, rate: 0.03 },
  { min: 74_855, max: 79_346, rate: 0.035 },
  { min: 79_346, max: 84_107, rate: 0.04 },
  { min: 84_107, max: 89_154, rate: 0.045 },
  { min: 89_154, max: 94_503, rate: 0.05 },
  { min: 94_503, max: 100_174, rate: 0.055 },
  { min: 100_174, max: 106_185, rate: 0.06 },
  { min: 106_185, max: 112_556, rate: 0.065 },
  { min: 112_556, max: 119_309, rate: 0.07 },
  { min: 119_309, max: 126_467, rate: 0.075 },
  { min: 126_467, max: 134_056, rate: 0.08 },
  { min: 134_056, max: 142_100, rate: 0.085 },
  { min: 142_100, max: 150_626, rate: 0.09 },
  { min: 150_626, max: 159_663, rate: 0.095 },
  { min: 159_663, max: null, rate: 0.1 },
];

function helpRepayment(income: number): number {
  const bracket = [...HELP_BRACKETS]
    .reverse()
    .find((b) => income > b.min);
  return bracket ? income * bracket.rate : 0;
}

export interface TaxInput {
  grossIncome: number;
  taxYear: TaxYear;
  hasPrivateHealthCover?: boolean;
  hasHelpDebt?: boolean;
  salaryPackaging?: number;
}

export interface TaxResult {
  grossIncome: number;
  taxableIncome: number;
  incomeTax: number;
  lito: number;
  medicareLevy: number;
  medicareLevySurcharge: number;
  helpRepayment: number;
  totalTax: number;
  netIncome: number;
  netMonthly: number;
  netFortnightly: number;
  netWeekly: number;
  effectiveTaxRate: number;
  marginalTaxRate: number;
}

export function calculateAuTax(input: TaxInput): TaxResult {
  const grossIncome = Math.max(0, input.grossIncome);
  const taxableIncome = Math.max(0, grossIncome - (input.salaryPackaging ?? 0));
  const brackets = bracketsFor(input.taxYear);

  const grossTax = taxOnBrackets(taxableIncome, brackets);
  const offset = lito(taxableIncome);
  const incomeTax = Math.max(0, grossTax - offset);

  const levy = medicareLevy(taxableIncome);
  const surcharge = input.hasPrivateHealthCover
    ? 0
    : medicareLevySurcharge(taxableIncome);
  const help = input.hasHelpDebt ? helpRepayment(taxableIncome) : 0;

  const totalTax = incomeTax + levy + surcharge + help;
  const netIncome = grossIncome - totalTax;

  const marginalBracket = [...brackets].reverse().find((b) => taxableIncome > b.min);

  return {
    grossIncome,
    taxableIncome,
    incomeTax,
    lito: offset,
    medicareLevy: levy,
    medicareLevySurcharge: surcharge,
    helpRepayment: help,
    totalTax,
    netIncome,
    netMonthly: netIncome / 12,
    netFortnightly: netIncome / 26,
    netWeekly: netIncome / 52,
    effectiveTaxRate: grossIncome > 0 ? totalTax / grossIncome : 0,
    marginalTaxRate: (marginalBracket?.rate ?? 0) + MEDICARE_RATE,
  };
}
