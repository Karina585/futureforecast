import type { TaxResult, TaxYear } from "../lib/auTax";
import { TAX_YEARS } from "../lib/auTax";
import { formatCurrency, formatPercent } from "../lib/format";
import { NumberField } from "./NumberField";

interface Props {
  salary: number;
  taxYear: TaxYear;
  hasPrivateHealthCover: boolean;
  hasHelpDebt: boolean;
  salaryPackaging: number;
  result: TaxResult;
  onChange: (patch: Partial<{
    salary: number;
    taxYear: TaxYear;
    hasPrivateHealthCover: boolean;
    hasHelpDebt: boolean;
    salaryPackaging: number;
  }>) => void;
}

export function TaxCard({
  salary,
  taxYear,
  hasPrivateHealthCover,
  hasHelpDebt,
  salaryPackaging,
  result,
  onChange,
}: Props) {
  return (
    <section className="card">
      <h2>Salary &amp; income tax</h2>
      <div className="field-grid">
        <label className="field">
          <span>Gross annual salary</span>
          <NumberField
            min={0}
            step={1000}
            value={salary}
            onChange={(v) => onChange({ salary: v })}
          />
        </label>
        <label className="field">
          <span>Tax year</span>
          <select
            value={taxYear}
            onChange={(e) => onChange({ taxYear: e.target.value as TaxYear })}
          >
            {TAX_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Salary packaging / pre-tax deductions</span>
          <NumberField
            min={0}
            step={100}
            value={salaryPackaging}
            onChange={(v) => onChange({ salaryPackaging: v })}
          />
        </label>
        <label className="field checkbox">
          <input
            type="checkbox"
            checked={hasPrivateHealthCover}
            onChange={(e) => onChange({ hasPrivateHealthCover: e.target.checked })}
          />
          <span>I have private hospital cover</span>
        </label>
        <label className="field checkbox">
          <input
            type="checkbox"
            checked={hasHelpDebt}
            onChange={(e) => onChange({ hasHelpDebt: e.target.checked })}
          />
          <span>I have a HELP/HECS debt</span>
        </label>
      </div>

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
      <p className="disclaimer">
        Estimate only, based on published ATO resident individual rates. Medicare
        levy low-income thresholds and HELP thresholds are indexed annually —
        verify current figures with the ATO before relying on this for decisions.
      </p>
    </section>
  );
}
