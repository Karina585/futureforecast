import { requiredRepayment } from "../lib/mortgage";
import { formatCurrency } from "../lib/format";

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
    <section className="card">
      <h2>Mortgage &amp; offset account</h2>
      <div className="field-grid">
        <label className="field">
          <span>Loan amount</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={loanAmount}
            onChange={(e) => onChange({ loanAmount: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Interest rate (% p.a.)</span>
          <input
            type="number"
            min={0}
            step={0.05}
            value={annualInterestRatePct}
            onChange={(e) =>
              onChange({ annualInterestRatePct: Number(e.target.value) })
            }
          />
        </label>
        <label className="field">
          <span>Monthly repayment</span>
          <input
            type="number"
            min={0}
            step={50}
            value={monthlyRepayment}
            onChange={(e) => onChange({ monthlyRepayment: Number(e.target.value) })}
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
          <input
            type="number"
            min={0}
            step={500}
            value={offsetBalance}
            onChange={(e) => onChange({ offsetBalance: Number(e.target.value) })}
          />
        </label>
      </div>

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
