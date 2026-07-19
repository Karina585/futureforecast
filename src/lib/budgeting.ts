// Transaction categorization and monthly expense/income summarization for
// bank-exported CSV data. Runs entirely client-side — nothing is uploaded.

export interface CategoryRule {
  id: string;
  keyword: string;
  category: string;
}

export const UNCATEGORIZED = "Uncategorized";

export const DEFAULT_CATEGORY_RULES: Omit<CategoryRule, "id">[] = [
  { keyword: "woolworths", category: "Groceries" },
  { keyword: "coles", category: "Groceries" },
  { keyword: "aldi", category: "Groceries" },
  { keyword: "iga", category: "Groceries" },
  { keyword: "uber", category: "Transport" },
  { keyword: "opal", category: "Transport" },
  { keyword: "myki", category: "Transport" },
  { keyword: "bp ", category: "Transport" },
  { keyword: "shell", category: "Transport" },
  { keyword: "caltex", category: "Transport" },
  { keyword: "netflix", category: "Subscriptions" },
  { keyword: "spotify", category: "Subscriptions" },
  { keyword: "stan", category: "Subscriptions" },
  { keyword: "rent", category: "Housing" },
  { keyword: "mortgage", category: "Housing" },
  { keyword: "electricity", category: "Utilities" },
  { keyword: "energy", category: "Utilities" },
  { keyword: "telstra", category: "Utilities" },
  { keyword: "optus", category: "Utilities" },
  { keyword: "salary", category: "Income" },
  { keyword: "wages", category: "Income" },
  { keyword: "payroll", category: "Income" },
];

export interface Transaction {
  date: string; // ISO date
  description: string;
  amount: number; // negative = expense, positive = income
  category: string;
}

export function categorize(description: string, rules: CategoryRule[]): string {
  const lower = description.toLowerCase();
  const match = rules.find((r) => r.keyword.trim() && lower.includes(r.keyword.toLowerCase()));
  return match?.category ?? UNCATEGORIZED;
}

/** Parses ISO (YYYY-MM-DD) or Australian-convention DD/MM/YYYY (or DD-MM-YYYY) dates. */
export function parseBankDate(raw: string): string | null {
  const trimmed = raw.trim();
  let m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    return `${m[3]}-${month}-${day}`;
  }
  return null;
}

/** Parses amounts like "$1,234.56", "-50.00", or "(50.00)" (parens = negative). */
export function parseBankAmount(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === "") return NaN;
  const negative = /^\(.*\)$/.test(trimmed) || trimmed.startsWith("-");
  const cleaned = trimmed.replace(/[()$,]/g, "").replace(/^-/, "").trim();
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) return NaN;
  return negative ? -value : value;
}

export interface ColumnGuess {
  dateCol: number | null;
  descCol: number | null;
  amountCol: number | null;
  debitCol: number | null;
  creditCol: number | null;
}

/** Guesses which columns hold what, from common bank CSV header names. */
export function guessColumns(headers: string[]): ColumnGuess {
  const find = (patterns: string[]): number | null => {
    const idx = headers.findIndex((h) =>
      patterns.some((p) => h.toLowerCase().includes(p))
    );
    return idx === -1 ? null : idx;
  };
  return {
    dateCol: find(["date"]),
    descCol: find(["description", "details", "narrative", "merchant"]),
    amountCol: find(["amount"]),
    debitCol: find(["debit", "withdrawal"]),
    creditCol: find(["credit", "deposit"]),
  };
}

export interface RawRow {
  date: string;
  description: string;
  amount: number;
}

export function buildTransactions(rows: RawRow[], rules: CategoryRule[]): Transaction[] {
  return rows
    .filter((r) => r.date && !Number.isNaN(r.amount))
    .map((r) => ({
      date: r.date,
      description: r.description,
      amount: r.amount,
      category: categorize(r.description, rules),
    }));
}

function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7); // "YYYY-MM"
}

export interface MonthSummary {
  month: string; // "YYYY-MM"
  totalIncome: number;
  totalExpenses: number; // positive number
  netCashFlow: number;
  byCategory: Record<string, number>; // signed totals per category
}

export function summarizeByMonth(transactions: Transaction[]): MonthSummary[] {
  const months = new Map<string, MonthSummary>();

  for (const t of transactions) {
    const key = monthKey(t.date);
    let summary = months.get(key);
    if (!summary) {
      summary = { month: key, totalIncome: 0, totalExpenses: 0, netCashFlow: 0, byCategory: {} };
      months.set(key, summary);
    }
    if (t.amount >= 0) {
      summary.totalIncome += t.amount;
    } else {
      summary.totalExpenses += -t.amount;
    }
    summary.netCashFlow += t.amount;
    summary.byCategory[t.category] = (summary.byCategory[t.category] ?? 0) + t.amount;
  }

  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/** Average net cash flow per calendar month present in the data. */
export function averageMonthlyFreeCashFlow(summaries: MonthSummary[]): number {
  if (summaries.length === 0) return 0;
  const total = summaries.reduce((sum, m) => sum + m.netCashFlow, 0);
  return total / summaries.length;
}
