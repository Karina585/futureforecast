import type { MortgageResult } from "../lib/mortgage";
import { formatCurrency, formatDate, formatMonthsAsYears } from "../lib/format";

interface Props {
  /** Actual forecast: real offset balance plus your scheduled events. */
  withExtras: MortgageResult;
  /** Real offset balance, but no scheduled extra repayments/redraws. */
  offsetOnly: MortgageResult;
  /** No offset balance and no scheduled events — a plain vanilla loan. */
  noOffset: MortgageResult;
}

function monthsSaved(from: MortgageResult, to: MortgageResult): number | null {
  return from.payoffMonthIndex !== null && to.payoffMonthIndex !== null
    ? from.payoffMonthIndex - to.payoffMonthIndex
    : null;
}

export function SummaryCards({ withExtras, offsetOnly, noOffset }: Props) {
  const offsetMonths = monthsSaved(noOffset, offsetOnly);
  const extrasMonths = monthsSaved(offsetOnly, withExtras);
  const offsetInterest = noOffset.totalInterestPaid - offsetOnly.totalInterestPaid;
  const extrasInterest = offsetOnly.totalInterestPaid - withExtras.totalInterestPaid;

  const netWorthToday = withExtras.points[0]?.netWorth ?? 0;
  const netWorthAtEnd = withExtras.points[withExtras.points.length - 1]?.netWorth ?? 0;

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
      <div className="stat-tile">
        <span className="stat-label">Net worth today</span>
        <span className="stat-value">{formatCurrency(netWorthToday)}</span>
        <span className="stat-sub">offset balance − loan balance</span>
      </div>
      <div className={`stat-tile${netWorthAtEnd > 0 ? " stat-tile--good" : ""}`}>
        <span className="stat-label">Projected net worth at end of forecast</span>
        <span className="stat-value">{formatCurrency(netWorthAtEnd)}</span>
      </div>
      {offsetMonths !== null && offsetMonths > 0 && (
        <div className="stat-tile stat-tile--good">
          <span className="stat-label">Saved by your offset account</span>
          <span className="stat-value">{formatMonthsAsYears(offsetMonths)}</span>
          <span className="stat-sub">{formatCurrency(offsetInterest)} interest</span>
        </div>
      )}
      {extrasMonths !== null && extrasMonths > 0 && (
        <div className="stat-tile stat-tile--good">
          <span className="stat-label">Saved by extra repayments/redraws</span>
          <span className="stat-value">{formatMonthsAsYears(extrasMonths)}</span>
          <span className="stat-sub">{formatCurrency(extrasInterest)} interest</span>
        </div>
      )}
    </div>
  );
}
