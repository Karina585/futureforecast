import { useMemo, useState } from "react";
import { parseCsv } from "../lib/csv";
import {
  DEFAULT_CATEGORY_RULES,
  averageMonthlyFreeCashFlow,
  buildTransactions,
  guessColumns,
  parseBankAmount,
  parseBankDate,
  summarizeByMonth,
  type CategoryRule,
  type RawRow,
} from "../lib/budgeting";
import { newId } from "../lib/appState";
import { formatCurrency } from "../lib/format";

interface Props {
  onPushFreeCashFlow: (monthlyAmount: number) => void;
}

export function BudgetingCard({ onPushFreeCashFlow }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<string[][]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [dateCol, setDateCol] = useState<number | null>(null);
  const [descCol, setDescCol] = useState<number | null>(null);
  const [useDebitCredit, setUseDebitCredit] = useState(false);
  const [amountCol, setAmountCol] = useState<number | null>(null);
  const [debitCol, setDebitCol] = useState<number | null>(null);
  const [creditCol, setCreditCol] = useState<number | null>(null);
  const [rules, setRules] = useState<CategoryRule[]>(() =>
    DEFAULT_CATEGORY_RULES.map((r) => ({ ...r, id: newId() }))
  );
  const [pushedAmount, setPushedAmount] = useState<number | null>(null);

  const headerLabels = hasHeader && rows[0] ? rows[0] : (rows[0]?.map((_, i) => `Column ${i + 1}`) ?? []);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const handleFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    setRows(parsed);
    setFileName(file.name);
    setPushedAmount(null);
    if (parsed.length > 0) {
      const guess = guessColumns(parsed[0]);
      setDateCol(guess.dateCol);
      setDescCol(guess.descCol);
      if (guess.amountCol !== null) {
        setUseDebitCredit(false);
        setAmountCol(guess.amountCol);
      } else if (guess.debitCol !== null || guess.creditCol !== null) {
        setUseDebitCredit(true);
        setDebitCol(guess.debitCol);
        setCreditCol(guess.creditCol);
      }
    }
  };

  const transactions = useMemo(() => {
    if (dateCol === null || descCol === null) return [];
    const rawRows: RawRow[] = dataRows.map((row) => {
      const date = parseBankDate(row[dateCol] ?? "") ?? "";
      const description = row[descCol] ?? "";
      let amount = NaN;
      if (useDebitCredit) {
        const debitRaw = debitCol !== null ? (row[debitCol] ?? "") : "";
        const creditRaw = creditCol !== null ? (row[creditCol] ?? "") : "";
        const debit = debitRaw.trim() === "" ? 0 : Math.abs(parseBankAmount(debitRaw) || 0);
        const credit = creditRaw.trim() === "" ? 0 : Math.abs(parseBankAmount(creditRaw) || 0);
        amount = credit - debit;
      } else if (amountCol !== null) {
        amount = parseBankAmount(row[amountCol] ?? "");
      }
      return { date, description, amount };
    });
    return buildTransactions(rawRows, rules);
  }, [dataRows, dateCol, descCol, useDebitCredit, amountCol, debitCol, creditCol, rules]);

  const summaries = useMemo(() => summarizeByMonth(transactions), [transactions]);
  const avgFreeCashFlow = useMemo(
    () => averageMonthlyFreeCashFlow(summaries),
    [summaries]
  );

  const columnOptions = headerLabels.map((label, i) => ({ value: i, label }));

  const addRule = () =>
    setRules([...rules, { id: newId(), keyword: "", category: "" }]);
  const updateRule = (id: string, patch: Partial<CategoryRule>) =>
    setRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRule = (id: string) => setRules(rules.filter((r) => r.id !== id));

  const mappingReady = dateCol !== null && descCol !== null &&
    (useDebitCredit ? debitCol !== null || creditCol !== null : amountCol !== null);

  return (
    <section className="card">
      <h2>Budgeting</h2>
      <p className="hint">
        Upload a CSV export from your bank to see expenses by category and
        your average monthly free cash flow. Everything runs in your browser
        — the file isn't uploaded anywhere, and it isn't saved between visits.
      </p>

      <div className="field-grid">
        <label className="field">
          <span>Bank transaction CSV</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
        {rows.length > 0 && (
          <label className="field checkbox">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
            />
            <span>First row is a header</span>
          </label>
        )}
      </div>

      {fileName && rows.length > 0 && (
        <>
          <div className="field-grid">
            <label className="field">
              <span>Date column</span>
              <select
                value={dateCol ?? ""}
                onChange={(e) => setDateCol(e.target.value === "" ? null : Number(e.target.value))}
              >
                <option value="">Select column</option>
                {columnOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Description column</span>
              <select
                value={descCol ?? ""}
                onChange={(e) => setDescCol(e.target.value === "" ? null : Number(e.target.value))}
              >
                <option value="">Select column</option>
                {columnOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field checkbox">
              <input
                type="checkbox"
                checked={useDebitCredit}
                onChange={(e) => setUseDebitCredit(e.target.checked)}
              />
              <span>Separate debit/credit columns (instead of one signed amount)</span>
            </label>
          </div>

          <div className="field-grid">
            {!useDebitCredit ? (
              <label className="field">
                <span>Amount column (negative = expense)</span>
                <select
                  value={amountCol ?? ""}
                  onChange={(e) =>
                    setAmountCol(e.target.value === "" ? null : Number(e.target.value))
                  }
                >
                  <option value="">Select column</option>
                  {columnOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label className="field">
                  <span>Debit column (money out)</span>
                  <select
                    value={debitCol ?? ""}
                    onChange={(e) =>
                      setDebitCol(e.target.value === "" ? null : Number(e.target.value))
                    }
                  >
                    <option value="">Select column</option>
                    {columnOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Credit column (money in)</span>
                  <select
                    value={creditCol ?? ""}
                    onChange={(e) =>
                      setCreditCol(e.target.value === "" ? null : Number(e.target.value))
                    }
                  >
                    <option value="">Select column</option>
                    {columnOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>

          {!mappingReady && (
            <p className="hint">Map the columns above to see your budget summary.</p>
          )}
        </>
      )}

      {mappingReady && (
        <>
          <h3 className="subheading">Category rules</h3>
          <ul className="event-list">
            {rules.map((rule) => (
              <li key={rule.id} className="event-row">
                <div className="field-grid event-row-grid">
                  <label className="field">
                    <span>Keyword (matches description)</span>
                    <input
                      type="text"
                      value={rule.keyword}
                      onChange={(e) => updateRule(rule.id, { keyword: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Category</span>
                    <input
                      type="text"
                      value={rule.category}
                      onChange={(e) => updateRule(rule.id, { category: e.target.value })}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove rule for ${rule.keyword}`}
                  onClick={() => removeRule(rule.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="quick-calc">
            <button type="button" className="ghost-button" onClick={addRule}>
              + Add category rule
            </button>
          </div>

          <h3 className="subheading">Monthly summary</h3>
          {summaries.length === 0 ? (
            <p className="hint">No transactions matched the selected columns.</p>
          ) : (
            <dl className="summary-list">
              {summaries.map((m) => (
                <div key={m.month}>
                  <dt>{m.month}</dt>
                  <dd>
                    +{formatCurrency(m.totalIncome)} / -{formatCurrency(m.totalExpenses)} ={" "}
                    {formatCurrency(m.netCashFlow)}
                  </dd>
                </div>
              ))}
              <div className="highlight">
                <dt>Average monthly free cash flow</dt>
                <dd>{formatCurrency(avgFreeCashFlow)}</dd>
              </div>
            </dl>
          )}

          {summaries.length > 0 && avgFreeCashFlow > 0 && (
            <div className="quick-calc">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  onPushFreeCashFlow(Math.round(avgFreeCashFlow));
                  setPushedAmount(Math.round(avgFreeCashFlow));
                }}
              >
                Add {formatCurrency(avgFreeCashFlow)}/mo as a recurring extra repayment
              </button>
              {pushedAmount !== null && (
                <span className="field-note">
                  Added to Extra repayments &amp; redraws below.
                </span>
              )}
            </div>
          )}
        </>
      )}

      <p className="disclaimer">
        Categorization is a simple keyword match you control — it won't be
        perfect. Review the monthly totals before relying on the free cash
        flow figure.
      </p>
    </section>
  );
}
