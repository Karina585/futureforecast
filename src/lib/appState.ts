import type { TaxYear } from "./auTax";
import type { ScheduledEvent } from "./mortgage";

export interface AppState {
  salary: number;
  taxYear: TaxYear;
  hasPrivateHealthCover: boolean;
  hasHelpDebt: boolean;
  salaryPackaging: number;

  loanAmount: number;
  annualInterestRatePct: number;
  monthlyRepayment: number;
  startDate: string;
  offsetBalance: number;

  events: ScheduledEvent[];
}

export const DEFAULT_STATE: AppState = {
  salary: 100_000,
  taxYear: "2026-27",
  hasPrivateHealthCover: true,
  hasHelpDebt: false,
  salaryPackaging: 0,

  loanAmount: 500_000,
  annualInterestRatePct: 6,
  monthlyRepayment: 3000,
  startDate: new Date().toISOString().slice(0, 10),
  offsetBalance: 20_000,

  events: [],
};

export function newEventId(): string {
  return Math.random().toString(36).slice(2, 10);
}
