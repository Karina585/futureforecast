import type { IncomeSource } from "../lib/auTax";
import { netIncomeSourcesTotal } from "../lib/auTax";
import { newId } from "../lib/appState";
import { formatCurrency } from "../lib/format";
import { CollapsibleCard } from "./CollapsibleCard";
import { NumberField } from "./NumberField";

interface Props {
  sources: IncomeSource[];
  onChange: (sources: IncomeSource[]) => void;
}

function makeSource(): IncomeSource {
  return {
    id: newId(),
    label: "Rental income",
    grossAnnualAmount: 20_000,
    deductibleExpenses: 8_000,
  };
}

export function IncomeSourcesCard({ sources, onChange }: Props) {
  const update = (id: string, patch: Partial<IncomeSource>) => {
    onChange(sources.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };
  const remove = (id: string) => onChange(sources.filter((s) => s.id !== id));
  const add = () => onChange([...sources, makeSource()]);

  const total = netIncomeSourcesTotal(sources);
  const summary =
    sources.length === 0
      ? "None"
      : `${sources.length} source${sources.length > 1 ? "s" : ""}, ${formatCurrency(total)} net`;

  return (
    <CollapsibleCard
      title="Other income"
      summary={summary}
      defaultOpen={sources.length > 0}
      className="income-card"
    >
      <p className="hint">
        Non-salary income such as rental income. Each source's net amount
        (gross minus deductible expenses) is added to your taxable income — a
        net loss (negative gearing) reduces it instead.
      </p>

      {sources.length === 0 && <p className="hint">No other income sources yet.</p>}

      <ul className="event-list">
        {sources.map((source) => {
          const net = source.grossAnnualAmount - source.deductibleExpenses;
          return (
            <li key={source.id} className="event-row">
              <div className="field-grid event-row-grid">
                <label className="field">
                  <span>Label</span>
                  <input
                    type="text"
                    value={source.label}
                    onChange={(e) => update(source.id, { label: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Gross annual amount</span>
                  <NumberField
                    min={0}
                    step={500}
                    value={source.grossAnnualAmount}
                    onChange={(v) => update(source.id, { grossAnnualAmount: v })}
                  />
                </label>
                <label className="field">
                  <span>Deductible expenses (annual)</span>
                  <NumberField
                    min={0}
                    step={500}
                    value={source.deductibleExpenses}
                    onChange={(v) => update(source.id, { deductibleExpenses: v })}
                  />
                </label>
                <div className="field">
                  <span>Net taxable amount</span>
                  <span className="field-note">
                    {net < 0 ? "− " : ""}
                    {formatCurrency(Math.abs(net))}
                    {net < 0 ? " (loss)" : ""}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${source.label}`}
                onClick={() => remove(source.id)}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      {sources.length > 0 && (
        <p className="hint">
          Total net contribution to taxable income:{" "}
          <strong>{formatCurrency(total)}</strong>
        </p>
      )}

      <div className="quick-calc">
        <button type="button" className="ghost-button" onClick={add}>
          + Add income source
        </button>
      </div>
    </CollapsibleCard>
  );
}
