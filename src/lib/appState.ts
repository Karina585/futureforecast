import type { IncomeSource, TaxYear } from "./auTax";
import type { ScheduledEvent } from "./mortgage";
import { DEFAULT_SG_RATE_PCT } from "./superannuation";

export interface AppState {
  salary: number;
  taxYear: TaxYear;
  hasPrivateHealthCover: boolean;
  hasHelpDebt: boolean;
  salaryPackaging: number;
  incomeSources: IncomeSource[];

  loanAmount: number;
  annualInterestRatePct: number;
  monthlyRepayment: number;
  startDate: string;
  offsetBalance: number;
  startingSavingsBalance: number;

  events: ScheduledEvent[];

  superStartingBalance: number;
  superSgRatePct: number;
  superSalarySacrificeAnnual: number;
  superNonConcessionalAnnual: number;
  superAnnualReturnPct: number;

  investmentsStartingBalance: number;
  investmentsAnnualReturnPct: number;

  hasPartner: boolean;
  partnerSalary: number;
  partnerHasPrivateHealthCover: boolean;
  partnerHasHelpDebt: boolean;
  partnerSalaryPackaging: number;
}

export const DEFAULT_STATE: AppState = {
  salary: 100_000,
  taxYear: "2026-27",
  hasPrivateHealthCover: true,
  hasHelpDebt: false,
  salaryPackaging: 0,
  incomeSources: [],

  loanAmount: 500_000,
  annualInterestRatePct: 6,
  monthlyRepayment: 3000,
  startDate: new Date().toISOString().slice(0, 10),
  offsetBalance: 20_000,
  startingSavingsBalance: 0,

  events: [],

  superStartingBalance: 50_000,
  superSgRatePct: DEFAULT_SG_RATE_PCT,
  superSalarySacrificeAnnual: 0,
  superNonConcessionalAnnual: 0,
  superAnnualReturnPct: 7,

  investmentsStartingBalance: 0,
  investmentsAnnualReturnPct: 8,

  hasPartner: false,
  partnerSalary: 80_000,
  partnerHasPrivateHealthCover: true,
  partnerHasHelpDebt: false,
  partnerSalaryPackaging: 0,
};

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}
