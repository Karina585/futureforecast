import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATEGORY_RULES,
  UNCATEGORIZED,
  averageMonthlyFreeCashFlow,
  buildTransactions,
  categorize,
  guessColumns,
  parseBankAmount,
  parseBankDate,
  summarizeByMonth,
} from "./budgeting";

describe("guessColumns", () => {
  it("finds a single Date/Description/Amount layout", () => {
    const result = guessColumns(["Date", "Description", "Amount", "Balance"]);
    expect(result).toEqual({
      dateCol: 0,
      descCol: 1,
      amountCol: 2,
      debitCol: null,
      creditCol: null,
    });
  });

  it("finds a Debit/Credit layout", () => {
    const result = guessColumns(["Transaction Date", "Narrative", "Debit", "Credit", "Balance"]);
    expect(result.dateCol).toBe(0);
    expect(result.descCol).toBe(1);
    expect(result.debitCol).toBe(2);
    expect(result.creditCol).toBe(3);
  });

  it("returns null for columns it can't find", () => {
    const result = guessColumns(["Col A", "Col B"]);
    expect(result.dateCol).toBeNull();
    expect(result.amountCol).toBeNull();
  });
});

describe("parseBankDate", () => {
  it("parses ISO dates", () => {
    expect(parseBankDate("2026-03-15")).toBe("2026-03-15");
  });

  it("parses Australian-convention DD/MM/YYYY dates", () => {
    expect(parseBankDate("15/03/2026")).toBe("2026-03-15");
  });

  it("parses DD-MM-YYYY dates", () => {
    expect(parseBankDate("05-01-2026")).toBe("2026-01-05");
  });

  it("returns null for unrecognized formats", () => {
    expect(parseBankDate("not a date")).toBeNull();
  });
});

describe("parseBankAmount", () => {
  it("parses plain numbers", () => {
    expect(parseBankAmount("123.45")).toBeCloseTo(123.45);
    expect(parseBankAmount("-50")).toBeCloseTo(-50);
  });

  it("strips dollar signs and thousands separators", () => {
    expect(parseBankAmount("$1,234.56")).toBeCloseTo(1234.56);
  });

  it("treats parenthesized amounts as negative", () => {
    expect(parseBankAmount("(50.00)")).toBeCloseTo(-50);
  });

  it("returns NaN for empty or non-numeric input", () => {
    expect(parseBankAmount("")).toBeNaN();
    expect(parseBankAmount("N/A")).toBeNaN();
  });
});

const rules = DEFAULT_CATEGORY_RULES.map((r, i) => ({ ...r, id: String(i) }));

describe("categorize", () => {
  it("matches a rule case-insensitively by keyword", () => {
    expect(categorize("WOOLWORTHS 1234 SYDNEY", rules)).toBe("Groceries");
    expect(categorize("Netflix.com", rules)).toBe("Subscriptions");
  });

  it("falls back to Uncategorized when nothing matches", () => {
    expect(categorize("Random Merchant Pty Ltd", rules)).toBe(UNCATEGORIZED);
  });

  it("uses the first matching rule", () => {
    const customRules = [
      { id: "1", keyword: "coffee", category: "Cafes" },
      { id: "2", keyword: "coffee shop", category: "More specific cafes" },
    ];
    expect(categorize("Coffee Shop on Main St", customRules)).toBe("Cafes");
  });
});

describe("buildTransactions", () => {
  it("skips rows with no date or a non-numeric amount", () => {
    const result = buildTransactions(
      [
        { date: "2026-01-01", description: "Coles", amount: -50 },
        { date: "", description: "Bad row", amount: -10 },
        { date: "2026-01-02", description: "Also bad", amount: NaN },
      ],
      rules
    );
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Groceries");
  });
});

describe("summarizeByMonth", () => {
  it("groups transactions by month and totals income/expenses separately", () => {
    const transactions = buildTransactions(
      [
        { date: "2026-01-05", description: "Salary", amount: 5000 },
        { date: "2026-01-10", description: "Woolworths", amount: -200 },
        { date: "2026-02-05", description: "Salary", amount: 5000 },
        { date: "2026-02-12", description: "Netflix", amount: -20 },
      ],
      rules
    );
    const summaries = summarizeByMonth(transactions);
    expect(summaries).toHaveLength(2);
    expect(summaries[0].month).toBe("2026-01");
    expect(summaries[0].totalIncome).toBe(5000);
    expect(summaries[0].totalExpenses).toBe(200);
    expect(summaries[0].netCashFlow).toBe(4800);
    expect(summaries[0].byCategory["Groceries"]).toBe(-200);
    expect(summaries[1].month).toBe("2026-02");
    expect(summaries[1].netCashFlow).toBe(4980);
  });
});

describe("averageMonthlyFreeCashFlow", () => {
  it("averages net cash flow across all months present", () => {
    const transactions = buildTransactions(
      [
        { date: "2026-01-05", description: "Salary", amount: 4000 },
        { date: "2026-02-05", description: "Salary", amount: 6000 },
      ],
      rules
    );
    const summaries = summarizeByMonth(transactions);
    expect(averageMonthlyFreeCashFlow(summaries)).toBeCloseTo(5000, 0);
  });

  it("returns 0 for no data", () => {
    expect(averageMonthlyFreeCashFlow([])).toBe(0);
  });
});
