import type { TaxResult } from "../lib/auTax";
import { formatCurrency } from "../lib/format";
import { NumberField } from "./NumberField";
import { TaxSummaryList } from "./TaxSummaryList";

interface Props {
  hasPartner: boolean;
  partnerSalary: number;
  partnerHasPrivateHealthCover: boolean;
  partnerHasHelpDebt: boolean;
  partnerSalaryPackaging: number;
  primaryResult: TaxResult;
  partnerResult: TaxResult;
  onChange: (patch: Partial<{
    hasPartner: boolean;
    partnerSalary: number;
    partnerHasPrivateHealthCover: boolean;
    partnerHasHelpDebt: boolean;
    partnerSalaryPackaging: number;
  }>) => void;
}

export function PartnerCard({
  hasPartner,
  partnerSalary,
  partnerHasPrivateHealthCover,
  partnerHasHelpDebt,
  partnerSalaryPackaging,
  primaryResult,
  partnerResult,
  onChange,
}: Props) {
  return (
    <section className="card">
      <h2>Partner</h2>
      <label className="field checkbox">
        <input
          type="checkbox"
          checked={hasPartner}
          onChange={(e) => onChange({ hasPartner: e.target.checked })}
        />
        <span>We share finances with a partner</span>
      </label>

      {hasPartner && (
        <>
          <div className="field-grid partner-fields">
            <label className="field">
              <span>Partner's gross annual salary</span>
              <NumberField
                min={0}
                step={1000}
                value={partnerSalary}
                onChange={(v) => onChange({ partnerSalary: v })}
              />
            </label>
            <label className="field">
              <span>Partner's salary packaging / pre-tax deductions</span>
              <NumberField
                min={0}
                step={100}
                value={partnerSalaryPackaging}
                onChange={(v) => onChange({ partnerSalaryPackaging: v })}
              />
            </label>
            <label className="field checkbox">
              <input
                type="checkbox"
                checked={partnerHasPrivateHealthCover}
                onChange={(e) =>
                  onChange({ partnerHasPrivateHealthCover: e.target.checked })
                }
              />
              <span>Partner has private hospital cover</span>
            </label>
            <label className="field checkbox">
              <input
                type="checkbox"
                checked={partnerHasHelpDebt}
                onChange={(e) => onChange({ partnerHasHelpDebt: e.target.checked })}
              />
              <span>Partner has a HELP/HECS debt</span>
            </label>
          </div>

          <h3 className="subheading">Partner's tax</h3>
          <TaxSummaryList result={partnerResult} />

          <dl className="summary-list">
            <div className="highlight">
              <dt>Household net income (annual)</dt>
              <dd>{formatCurrency(primaryResult.netIncome + partnerResult.netIncome)}</dd>
            </div>
            <div>
              <dt>Household net income (monthly)</dt>
              <dd>
                {formatCurrency(primaryResult.netMonthly + partnerResult.netMonthly)}
              </dd>
            </div>
            <div>
              <dt>Household net income (fortnightly)</dt>
              <dd>
                {formatCurrency(
                  primaryResult.netFortnightly + partnerResult.netFortnightly
                )}
              </dd>
            </div>
          </dl>
          <p className="hint">
            The mortgage and offset account below are treated as shared —
            household net income is for reference when deciding how much you
            can put toward extra repayments together.
          </p>
        </>
      )}
    </section>
  );
}
