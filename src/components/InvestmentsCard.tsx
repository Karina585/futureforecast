import { balanceAtYears, type InvestmentResult } from "../lib/investments";
import { formatCurrency } from "../lib/format";
import { CollapsibleCard } from "./CollapsibleCard";
import { NumberField } from "./NumberField";

interface Props {
  startingSavingsBalance: number;
  investmentsStartingBalance: number;
  investmentsAnnualReturnPct: number;
  result: InvestmentResult;
  onChange: (patch: Partial<{
    startingSavingsBalance: number;
    investmentsStartingBalance: number;
    investmentsAnnualReturnPct: number;
  }>) => void;
}

export function InvestmentsCard({
  startingSavingsBalance,
  investmentsStartingBalance,
  investmentsAnnualReturnPct,
  result,
  onChange,
}: Props) {
  const summary = `${formatCurrency(investmentsStartingBalance)} invested, ${formatCurrency(startingSavingsBalance)} savings`;

  return (
    <CollapsibleCard title="Investments & savings" summary={summary} className="investments-card">
      <p className="hint">
        Track a cash/transaction account and an investments balance (e.g.
        shares) separately from your offset and super. Extra repayments in
        the section below can be routed into savings, and flagged as
        "funded by selling investments" to move money out of this balance
        instead of appearing as new net worth.
      </p>
      <div className="field-grid">
        <label className="field">
          <span>Cash / transaction savings balance (today)</span>
          <NumberField
            min={0}
            step={500}
            value={startingSavingsBalance}
            onChange={(v) => onChange({ startingSavingsBalance: v })}
          />
        </label>
        <label className="field">
          <span>Investments starting balance (e.g. shares)</span>
          <NumberField
            min={0}
            step={1000}
            value={investmentsStartingBalance}
            onChange={(v) => onChange({ investmentsStartingBalance: v })}
          />
        </label>
        <label className="field">
          <span>Expected annual investment return (%)</span>
          <NumberField
            min={0}
            step={0.5}
            value={investmentsAnnualReturnPct}
            onChange={(v) => onChange({ investmentsAnnualReturnPct: v })}
          />
        </label>
      </div>

      <dl className="summary-list">
        <div>
          <dt>Projected investments balance in 10 years</dt>
          <dd>{formatCurrency(balanceAtYears(result, 10))}</dd>
        </div>
        <div className="highlight">
          <dt>Projected investments balance in 20 years</dt>
          <dd>{formatCurrency(balanceAtYears(result, 20))}</dd>
        </div>
      </dl>

      <p className="disclaimer">
        Projections assume a constant return with no volatility — real
        investments fluctuate year to year. Savings isn't assumed to earn
        any interest.
      </p>
    </CollapsibleCard>
  );
}
