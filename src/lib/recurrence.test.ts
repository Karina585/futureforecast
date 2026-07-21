import { describe, expect, it } from "vitest";
import { occurrencesInPeriod } from "./recurrence";

describe("occurrencesInPeriod", () => {
  it("counts a one-off event only in the period it falls in", () => {
    const event = { recurrence: "once" as const, startDate: "2026-03-15" };
    expect(
      occurrencesInPeriod(event, new Date("2026-03-01"), new Date("2026-04-01"))
    ).toBe(1);
    expect(
      occurrencesInPeriod(event, new Date("2026-04-01"), new Date("2026-05-01"))
    ).toBe(0);
  });

  it("counts monthly occurrences one per period", () => {
    const event = { recurrence: "monthly" as const, startDate: "2026-01-01" };
    expect(
      occurrencesInPeriod(event, new Date("2026-05-01"), new Date("2026-06-01"))
    ).toBe(1);
  });

  it("counts quarterly occurrences only every third month", () => {
    const event = { recurrence: "quarterly" as const, startDate: "2026-01-01" };
    expect(
      occurrencesInPeriod(event, new Date("2026-03-01"), new Date("2026-04-01"))
    ).toBe(1);
    expect(
      occurrencesInPeriod(event, new Date("2026-04-01"), new Date("2026-05-01"))
    ).toBe(0);
  });

  it("respects an end date", () => {
    const event = {
      recurrence: "monthly" as const,
      startDate: "2026-01-01",
      endDate: "2026-05-01",
    };
    expect(
      occurrencesInPeriod(event, new Date("2026-04-01"), new Date("2026-05-01"))
    ).toBe(1);
    expect(
      occurrencesInPeriod(event, new Date("2026-05-01"), new Date("2026-06-01"))
    ).toBe(0);
  });

  it("counts weekly occurrences that may be more than one per month-long period", () => {
    const event = { recurrence: "weekly" as const, startDate: "2026-01-01" };
    const count = occurrencesInPeriod(event, new Date("2026-01-01"), new Date("2026-02-01"));
    expect(count).toBeGreaterThanOrEqual(4);
  });

  it("drops a one-off event dated exactly on periodStart unless inclusiveStart is set", () => {
    const event = { recurrence: "once" as const, startDate: "2026-01-01" };
    const periodStart = new Date("2026-01-01");
    const periodEnd = new Date("2026-02-01");
    expect(occurrencesInPeriod(event, periodStart, periodEnd)).toBe(0);
    expect(occurrencesInPeriod(event, periodStart, periodEnd, true)).toBe(1);
  });

  it("leaves recurring cadences unaffected by inclusiveStart", () => {
    // A monthly event's own start date coincides with periodStart here too,
    // but recurring cadences already land their first contribution at
    // periodEnd — inclusiveStart must not double-count it.
    const event = { recurrence: "monthly" as const, startDate: "2026-01-01" };
    const periodStart = new Date("2026-01-01");
    const periodEnd = new Date("2026-02-01");
    expect(occurrencesInPeriod(event, periodStart, periodEnd)).toBe(1);
    expect(occurrencesInPeriod(event, periodStart, periodEnd, true)).toBe(1);
  });
});
