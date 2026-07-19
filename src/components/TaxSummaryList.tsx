import type { TaxResult } from "../lib/auTax";
import { formatCurrency, formatPercent } from "../lib/format";

export function TaxSummaryList({ result }: { result: TaxResult }) {
  return (
    <dl className="summary-list">
      <div>
        <dt>Taxable income</dt>
        <dd>{formatCurrency(result.taxableIncome)}</dd>
      </div>
      <div>
        <dt>Income tax</dt>
        <dd>{formatCurrency(result.incomeTax)}</dd>
      </div>
      <div>
        <dt>Medicare levy</dt>
        <dd>{formatCurrency(result.medicareLevy)}</dd>
      </div>
      {result.medicareLevySurcharge > 0 && (
        <div>
          <dt>Medicare levy surcharge</dt>
          <dd>{formatCurrency(result.medicareLevySurcharge)}</dd>
        </div>
      )}
      {result.helpRepayment > 0 && (
        <div>
          <dt>HELP repayment</dt>
          <dd>{formatCurrency(result.helpRepayment)}</dd>
        </div>
      )}
      <div>
        <dt>Total tax</dt>
        <dd>{formatCurrency(result.totalTax)}</dd>
      </div>
      <div className="highlight">
        <dt>Net income (annual)</dt>
        <dd>{formatCurrency(result.netIncome)}</dd>
      </div>
      <div>
        <dt>Net income (monthly)</dt>
        <dd>{formatCurrency(result.netMonthly)}</dd>
      </div>
      <div>
        <dt>Net income (fortnightly)</dt>
        <dd>{formatCurrency(result.netFortnightly)}</dd>
      </div>
      <div>
        <dt>Effective / marginal rate</dt>
        <dd>
          {formatPercent(result.effectiveTaxRate)} / {formatPercent(result.marginalTaxRate)}
        </dd>
      </div>
    </dl>
  );
}
