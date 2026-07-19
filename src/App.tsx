import { useEffect, useMemo, useState } from "react";
import { calculateAuTax } from "./lib/auTax";
import { simulateMortgage, type ScheduledEvent } from "./lib/mortgage";
import { DEFAULT_STATE, type AppState } from "./lib/appState";
import { loadState, saveState } from "./lib/storage";
import { TaxCard } from "./components/TaxCard";
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
      }),
    [
      state.salary,
      state.taxYear,
      state.hasPrivateHealthCover,
      state.hasHelpDebt,
      state.salaryPackaging,
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
        events: state.events,
      }),
    [
      state.loanAmount,
      state.annualInterestRatePct,
      state.monthlyRepayment,
      state.startDate,
      state.offsetBalance,
      state.events,
    ]
  );

  const baselineResult = useMemo(
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

  const setEvents = (events: ScheduledEvent[]) => patch({ events });

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

        <div className="app-column">
          <section className="card">
            <h2>Loan &amp; offset forecast</h2>
            <SummaryCards withExtras={mortgageResult} baseline={baselineResult} />
            <ResultsChart
              points={mortgageResult.points}
              payoffMonthIndex={mortgageResult.payoffMonthIndex}
            />
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
