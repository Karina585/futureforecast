import { useEffect, useMemo, useState } from "react";
import { calculateAuTax, netIncomeSourcesTotal, type IncomeSource } from "./lib/auTax";
import { simulateMortgage, type ScheduledEvent } from "./lib/mortgage";
import { simulateSuper } from "./lib/superannuation";
import { simulateInvestments } from "./lib/investments";
import { combineNetWorth, sampleYearly } from "./lib/netWorth";
import { DEFAULT_STATE, newId, type AppState } from "./lib/appState";
import { loadState, saveState } from "./lib/storage";
import { TaxCard } from "./components/TaxCard";
import { PartnerCard } from "./components/PartnerCard";
import { IncomeSourcesCard } from "./components/IncomeSourcesCard";
import { SuperCard } from "./components/SuperCard";
import { InvestmentsCard } from "./components/InvestmentsCard";
import { BudgetingCard } from "./components/BudgetingCard";
import { MortgageCard } from "./components/MortgageCard";
import { EventsCard } from "./components/EventsCard";
import { ResultsChart } from "./components/ResultsChart";
import { SummaryCards } from "./components/SummaryCards";
import "./App.css";

function App() {
  const [state, setState] = useState<AppState>(() => loadState(DEFAULT_STATE));

  useEffect(() => {
    saveState(state);
  }, [state]);

  const patch = (p: Partial<AppState>) => setState((s) => ({ ...s, ...p }));

  const taxResult = useMemo(
    () =>
      calculateAuTax({
        grossIncome: state.salary,
        taxYear: state.taxYear,
        hasPrivateHealthCover: state.hasPrivateHealthCover,
        hasHelpDebt: state.hasHelpDebt,
        salaryPackaging: state.salaryPackaging,
        salarySacrificeSuper: state.superSalarySacrificeAnnual,
        otherTaxableIncome: netIncomeSourcesTotal(state.incomeSources),
      }),
    [
      state.salary,
      state.taxYear,
      state.hasPrivateHealthCover,
      state.hasHelpDebt,
      state.salaryPackaging,
      state.superSalarySacrificeAnnual,
      state.incomeSources,
    ]
  );

  const partnerTaxResult = useMemo(
    () =>
      calculateAuTax({
        grossIncome: state.partnerSalary,
        taxYear: state.taxYear,
        hasPrivateHealthCover: state.partnerHasPrivateHealthCover,
        hasHelpDebt: state.partnerHasHelpDebt,
        salaryPackaging: state.partnerSalaryPackaging,
      }),
    [
      state.partnerSalary,
      state.taxYear,
      state.partnerHasPrivateHealthCover,
      state.partnerHasHelpDebt,
      state.partnerSalaryPackaging,
    ]
  );

  const superResult = useMemo(
    () =>
      simulateSuper({
        startingBalance: state.superStartingBalance,
        salary: state.salary,
        sgRatePct: state.superSgRatePct,
        salarySacrificeAnnual: state.superSalarySacrificeAnnual,
        nonConcessionalAnnual: state.superNonConcessionalAnnual,
        annualReturnPct: state.superAnnualReturnPct,
        startDate: state.startDate,
      }),
    [
      state.superStartingBalance,
      state.salary,
      state.superSgRatePct,
      state.superSalarySacrificeAnnual,
      state.superNonConcessionalAnnual,
      state.superAnnualReturnPct,
      state.startDate,
    ]
  );

  const mortgageResult = useMemo(
    () =>
      simulateMortgage({
        loanAmount: state.loanAmount,
        annualInterestRatePct: state.annualInterestRatePct,
        monthlyRepayment: state.monthlyRepayment,
        startDate: state.startDate,
        offsetBalance: state.offsetBalance,
        startingSavingsBalance: state.startingSavingsBalance,
        events: state.events,
      }),
    [
      state.loanAmount,
      state.annualInterestRatePct,
      state.monthlyRepayment,
      state.startDate,
      state.offsetBalance,
      state.startingSavingsBalance,
      state.events,
    ]
  );

  const investmentsResult = useMemo(
    () =>
      simulateInvestments(
        {
          startingBalance: state.investmentsStartingBalance,
          annualReturnPct: state.investmentsAnnualReturnPct,
          startDate: state.startDate,
        },
        mortgageResult.points.map((p) => p.soldFromInvestments)
      ),
    [
      state.investmentsStartingBalance,
      state.investmentsAnnualReturnPct,
      state.startDate,
      mortgageResult,
    ]
  );

  const offsetOnlyResult = useMemo(
    () =>
      simulateMortgage({
        loanAmount: state.loanAmount,
        annualInterestRatePct: state.annualInterestRatePct,
        monthlyRepayment: state.monthlyRepayment,
        startDate: state.startDate,
        offsetBalance: state.offsetBalance,
        events: [],
      }),
    [
      state.loanAmount,
      state.annualInterestRatePct,
      state.monthlyRepayment,
      state.startDate,
      state.offsetBalance,
    ]
  );

  const noOffsetResult = useMemo(
    () =>
      simulateMortgage({
        loanAmount: state.loanAmount,
        annualInterestRatePct: state.annualInterestRatePct,
        monthlyRepayment: state.monthlyRepayment,
        startDate: state.startDate,
        offsetBalance: 0,
        events: [],
      }),
    [
      state.loanAmount,
      state.annualInterestRatePct,
      state.monthlyRepayment,
      state.startDate,
    ]
  );

  const netWorthPoints = useMemo(
    () => combineNetWorth(mortgageResult, superResult, investmentsResult),
    [mortgageResult, superResult, investmentsResult]
  );
  const netWorthYearly = useMemo(() => sampleYearly(netWorthPoints), [netWorthPoints]);
  const netWorthToday = netWorthPoints[0]?.netWorth ?? 0;
  const netWorthAtEnd = netWorthPoints[netWorthPoints.length - 1]?.netWorth ?? 0;

  const setEvents = (events: ScheduledEvent[]) => patch({ events });
  const setIncomeSources = (incomeSources: IncomeSource[]) => patch({ incomeSources });
  const pushFreeCashFlow = (monthlyAmount: number) => {
    const newEvent: ScheduledEvent = {
      id: newId(),
      label: "Free cash flow (from budgeting)",
      amount: monthlyAmount,
      kind: "repayment",
      recurrence: "monthly",
      startDate: new Date().toISOString().slice(0, 10),
    };
    patch({ events: [...state.events, newEvent] });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>FutureForecast</h1>
        <p>Australian salary, tax, and mortgage offset forecasting</p>
      </header>

      <main className="app-grid">
        <div className="app-column">
          <TaxCard
            salary={state.salary}
            taxYear={state.taxYear}
            hasPrivateHealthCover={state.hasPrivateHealthCover}
            hasHelpDebt={state.hasHelpDebt}
            salaryPackaging={state.salaryPackaging}
            result={taxResult}
            onChange={patch}
          />
          <PartnerCard
            hasPartner={state.hasPartner}
            partnerSalary={state.partnerSalary}
            partnerHasPrivateHealthCover={state.partnerHasPrivateHealthCover}
            partnerHasHelpDebt={state.partnerHasHelpDebt}
            partnerSalaryPackaging={state.partnerSalaryPackaging}
            primaryResult={taxResult}
            partnerResult={partnerTaxResult}
            onChange={patch}
          />
          <IncomeSourcesCard sources={state.incomeSources} onChange={setIncomeSources} />
          <SuperCard
            superStartingBalance={state.superStartingBalance}
            superSgRatePct={state.superSgRatePct}
            superSalarySacrificeAnnual={state.superSalarySacrificeAnnual}
            superNonConcessionalAnnual={state.superNonConcessionalAnnual}
            superAnnualReturnPct={state.superAnnualReturnPct}
            result={superResult}
            onChange={patch}
          />
          <InvestmentsCard
            startingSavingsBalance={state.startingSavingsBalance}
            investmentsStartingBalance={state.investmentsStartingBalance}
            investmentsAnnualReturnPct={state.investmentsAnnualReturnPct}
            result={investmentsResult}
            onChange={patch}
          />
          <BudgetingCard onPushFreeCashFlow={pushFreeCashFlow} />
          <MortgageCard
            loanAmount={state.loanAmount}
            annualInterestRatePct={state.annualInterestRatePct}
            monthlyRepayment={state.monthlyRepayment}
            startDate={state.startDate}
            offsetBalance={state.offsetBalance}
            onChange={patch}
          />
          <EventsCard events={state.events} onChange={setEvents} />
        </div>

        <div className="app-column app-column--sticky">
          <section className="card forecast-card">
            <h2>Loan &amp; offset forecast</h2>
            <SummaryCards
              withExtras={mortgageResult}
              offsetOnly={offsetOnlyResult}
              noOffset={noOffsetResult}
              netWorthToday={netWorthToday}
              netWorthAtEnd={netWorthAtEnd}
            />
            <ResultsChart points={netWorthYearly} />
            <p className="disclaimer">
              Forecast only — assumes a constant interest rate and repayment
              amount over time. Real rates and repayments change; treat this as
              a planning tool, not a guarantee.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
