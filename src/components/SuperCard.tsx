import {
  CONCESSIONAL_CAP,
  NON_CONCESSIONAL_CAP,
  balanceAtYears,
  simulateSuper,
} from "../lib/superannuation";
import { formatCurrency } from "../lib/format";
import { NumberField } from "./NumberField";

interface Props {
  salary: number;
  startDate: string;
  superStartingBalance: number;
  superSgRatePct: number;
  superSalarySacrificeAnnual: number;
  superNonConcessionalAnnual: number;
  superAnnualReturnPct: number;
  onChange: (patch: Partial<{
    superStartingBalance: number;
    superSgRatePct: number;
    superSalarySacrificeAnnual: number;
    superNonConcessionalAnnual: number;
    superAnnualReturnPct: number;
  }>) => void;
}

export function SuperCard({
  salary,
  startDate,
  superStartingBalance,
  superSgRatePct,
  superSalarySacrificeAnnual,
  superNonConcessionalAnnual,
  superAnnualReturnPct,
  onChange,
}: Props) {
  const result = simulateSuper({
    startingBalance: superStartingBalance,
    salary,
    sgRatePct: superSgRatePct,
    salarySacrificeAnnual: superSalarySacrificeAnnual,
    nonConcessionalAnnual: superNonConcessionalAnnual,
    annualReturnPct: superAnnualReturnPct,
    startDate,
  });

  return (
    <section className="card">
      <h2>Superannuation</h2>
      <div className="field-grid">
        <label className="field">
          <span>Starting super balance</span>
          <NumberField
            min={0}
            step={1000}
            value={superStartingBalance}
            onChange={(v) => onChange({ superStartingBalance: v })}
          />
        </label>
        <label className="field">
          <span>Super Guarantee rate (% of salary)</span>
          <NumberField
            min={0}
            step={0.5}
            value={superSgRatePct}
            onChange={(v) => onChange({ superSgRatePct: v })}
          />
        </label>
        <label className="field">
          <span>Salary sacrifice (concessional, annual)</span>
          <NumberField
            min={0}
            step={500}
            value={superSalarySacrificeAnnual}
            onChange={(v) => onChange({ superSalarySacrificeAnnual: v })}
          />
        </label>
        <label className="field">
          <span>Non-concessional contributions (annual)</span>
          <NumberField
            min={0}
            step={500}
            value={superNonConcessionalAnnual}
            onChange={(v) => onChange({ superNonConcessionalAnnual: v })}
          />
        </label>
        <label className="field">
          <span>Expected annual investment return (%)</span>
          <NumberField
            min={0}
            step={0.5}
            value={superAnnualReturnPct}
            onChange={(v) => onChange({ superAnnualReturnPct: v })}
          />
        </label>
      </div>

      <dl className="summary-list">
        <div>
          <dt>Employer SG contribution (annual)</dt>
          <dd>{formatCurrency(result.annualSgContribution)}</dd>
        </div>
        <div>
          <dt>Total concessional (annual)</dt>
          <dd>{formatCurrency(result.totalConcessionalAnnual)}</dd>
        </div>
        <div>
          <dt>Projected balance in 10 years</dt>
          <dd>{formatCurrency(balanceAtYears(result, 10))}</dd>
        </div>
        <div className="highlight">
          <dt>Projected balance in 20 years</dt>
          <dd>{formatCurrency(balanceAtYears(result, 20))}</dd>
        </div>
      </dl>

      {result.concessionalCapExceededBy > 0 && (
        <p className="field-note">
          Concessional contributions ({formatCurrency(result.totalConcessionalAnnual)})
          exceed the ${CONCESSIONAL_CAP.toLocaleString()} annual cap by{" "}
          {formatCurrency(result.concessionalCapExceededBy)} — the excess is typically
          taxed at your marginal rate instead of 15%, which this forecast doesn't model.
        </p>
      )}
      {result.nonConcessionalCapExceededBy > 0 && (
        <p className="field-note">
          Non-concessional contributions exceed the ${NON_CONCESSIONAL_CAP.toLocaleString()}{" "}
          annual cap by {formatCurrency(result.nonConcessionalCapExceededBy)}.
        </p>
      )}

      <p className="disclaimer">
        Estimate only. Contributions tax is a flat 15%; caps shown are current
        ATO figures and are periodically indexed. Does not model Division 293
        tax for very high incomes, or contribution eligibility rules.
      </p>
    </section>
  );
}
