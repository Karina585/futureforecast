import { requiredRepayment } from "../lib/mortgage";
import { formatCurrency } from "../lib/format";
import { NumberField } from "./NumberField";

interface Props {
  loanAmount: number;
  annualInterestRatePct: number;
  monthlyRepayment: number;
  startDate: string;
  offsetBalance: number;
  onChange: (patch: Partial<{
    loanAmount: number;
    annualInterestRatePct: number;
    monthlyRepayment: number;
    startDate: string;
    offsetBalance: number;
  }>) => void;
}

export function MortgageCard({
  loanAmount,
  annualInterestRatePct,
  monthlyRepayment,
  startDate,
  offsetBalance,
  onChange,
}: Props) {
  return (
    <section className="card mortgage-card">
      <h2>Mortgage &amp; offset account</h2>
      <div className="field-grid">
        <label className="field">
          <span>Loan amount</span>
          <NumberField
            min={0}
            step={1000}
            value={loanAmount}
            onChange={(v) => onChange({ loanAmount: v })}
          />
        </label>
        <label className="field">
          <span>Interest rate (% p.a.)</span>
          <NumberField
            min={0}
            step={0.05}
            value={annualInterestRatePct}
            onChange={(v) => onChange({ annualInterestRatePct: v })}
          />
        </label>
        <label className="field">
          <span>Monthly repayment</span>
          <NumberField
            min={0}
            step={50}
            value={monthlyRepayment}
            onChange={(v) => onChange({ monthlyRepayment: v })}
          />
        </label>
        <label className="field">
          <span>Loan start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Offset account balance (today)</span>
          <NumberField
            min={0}
            step={500}
            value={offsetBalance}
            onChange={(v) => onChange({ offsetBalance: v })}
          />
        </label>
      </div>
      <p className="hint">
        Your monthly repayment is taken as given, not derived from the start
        date — the start date is only used to place the forecast on a real
        calendar, so scheduled extra repayments/redraws (e.g. "every March 1")
        land in the right month on the chart.
      </p>

      <div className="quick-calc">
        {[25, 30].map((years) => {
          const repay = requiredRepayment(loanAmount, annualInterestRatePct, years * 12);
          return (
            <button
              type="button"
              key={years}
              className="ghost-button"
              onClick={() => onChange({ monthlyRepayment: Math.round(repay) })}
            >
              Use {years}-yr repayment ({formatCurrency(repay, false)}/mo)
            </button>
          );
        })}
      </div>
    </section>
  );
}
