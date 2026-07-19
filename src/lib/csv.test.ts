import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses a simple comma-separated table", () => {
    const result = parseCsv("Date,Description,Amount\n2026-01-01,Coffee,-4.50\n2026-01-02,Salary,3000");
    expect(result).toEqual([
      ["Date", "Description", "Amount"],
      ["2026-01-01", "Coffee", "-4.50"],
      ["2026-01-02", "Salary", "3000"],
    ]);
  });

  it("handles quoted fields with embedded commas", () => {
    const result = parseCsv('Date,Description,Amount\n2026-01-01,"Woolworths, Rozelle",-85.20');
    expect(result[1]).toEqual(["2026-01-01", "Woolworths, Rozelle", "-85.20"]);
  });

  it("handles escaped double quotes inside quoted fields", () => {
    const result = parseCsv('Date,Description\n2026-01-01,"He said ""hi"""');
    expect(result[1]).toEqual(["2026-01-01", 'He said "hi"']);
  });

  it("handles CRLF line endings", () => {
    const result = parseCsv("A,B\r\n1,2\r\n3,4");
    expect(result).toEqual([
      ["A", "B"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("handles a trailing newline without producing an empty row", () => {
    const result = parseCsv("A,B\n1,2\n");
    expect(result).toEqual([
      ["A", "B"],
      ["1", "2"],
    ]);
  });
});
