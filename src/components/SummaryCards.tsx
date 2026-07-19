import type { MortgageResult } from "../lib/mortgage";
import { formatCurrency, formatDate, formatMonthsAsYears } from "../lib/format";

interface Props {
  withExtras: MortgageResult;
  baseline: MortgageResult;
}

export function SummaryCards({ withExtras, baseline }: Props) {
  const monthsSaved =
    baseline.payoffMonthIndex !== null && withExtras.payoffMonthIndex !== null
      ? baseline.payoffMonthIndex - withExtras.payoffMonthIndex
      : null;
  const interestSaved = baseline.totalInterestPaid - withExtras.totalInterestPaid;

  return (
    <div className="stat-grid">
      <div className="stat-tile">
        <span className="stat-label">Forecast payoff date</span>
        <span className="stat-value">
          {withExtras.payoffDate ? formatDate(withExtras.payoffDate) : "Beyond forecast window"}
        </span>
        {withExtras.payoffMonthIndex !== null && (
          <span className="stat-sub">
            {formatMonthsAsYears(withExtras.payoffMonthIndex)} from start
          </span>
        )}
      </div>
      <div className="stat-tile">
        <span className="stat-label">Total interest paid</span>
        <span className="stat-value">{formatCurrency(withExtras.totalInterestPaid)}</span>
      </div>
      {monthsSaved !== null && monthsSaved > 0 && (
        <div className="stat-tile stat-tile--good">
          <span className="stat-label">Time saved vs. no extra repayments</span>
          <span className="stat-value">{formatMonthsAsYears(monthsSaved)}</span>
        </div>
      )}
      {interestSaved > 0 && (
        <div className="stat-tile stat-tile--good">
          <span className="stat-label">Interest saved vs. no extra repayments</span>
          <span className="stat-value">{formatCurrency(interestSaved)}</span>
        </div>
      )}
    </div>
  );
}
