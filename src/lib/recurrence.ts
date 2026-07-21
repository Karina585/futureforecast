export type RecurrenceFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "yearly";

export interface RecurrenceSpec {
  recurrence: "once" | RecurrenceFrequency;
  startDate: string; // ISO date
  endDate?: string; // ISO date, only for recurring events
}

/**
 * Occurrences of a recurring event that fall within (periodStart, periodEnd].
 *
 * Recurring cadences are self-consistent under this exclusive-lower-bound
 * convention: an occurrence that lands exactly on periodStart is simply the
 * previous period's periodEnd, already counted there, so nothing is ever
 * lost across the full simulation — the first contribution of a monthly
 * event starting on the simulation's own start date lands at the end of
 * period 1, not at t=0, which is a valid (and test-covered) interpretation.
 *
 * One-off ("once") events have no such fallback: if their single occurrence
 * falls exactly on periodStart, the exclusive bound drops it forever. That
 * matters in practice because the events form defaults a new event's date
 * to today, which is very often also the simulation's start date. `inclusiveStart`
 * — set only for the simulation's first period — fixes that one case without
 * touching recurring-cadence semantics.
 */
export function occurrencesInPeriod(
  event: RecurrenceSpec,
  periodStart: Date,
  periodEnd: Date,
  inclusiveStart = false
): number {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;

  if (event.recurrence === "once") {
    const d = start;
    const afterStart = inclusiveStart ? d >= periodStart : d > periodStart;
    return afterStart && d <= periodEnd && (!end || d <= end) ? 1 : 0;
  }

  const stepDays: Record<RecurrenceFrequency, number> = {
    weekly: 7,
    fortnightly: 14,
    monthly: 0, // handled by month arithmetic
    quarterly: 0, // handled by month arithmetic
    yearly: 0, // handled by year arithmetic
  };

  const monthlyRecurrences: RecurrenceFrequency[] = ["monthly", "quarterly", "yearly"];
  const monthSteps: Partial<Record<RecurrenceFrequency, number>> = {
    monthly: 1,
    quarterly: 3,
    yearly: 12,
  };

  let count = 0;
  if (monthlyRecurrences.includes(event.recurrence as RecurrenceFrequency)) {
    const cursor = new Date(start);
    const monthStep = monthSteps[event.recurrence as RecurrenceFrequency]!;
    // Fast-forward cursor to at or after periodStart without an unbounded loop.
    if (cursor < periodStart) {
      const monthsBetween =
        (periodStart.getFullYear() - cursor.getFullYear()) * 12 +
        (periodStart.getMonth() - cursor.getMonth());
      const steps = Math.floor(monthsBetween / monthStep);
      if (steps > 0) cursor.setMonth(cursor.getMonth() + steps * monthStep);
      while (cursor < periodStart) cursor.setMonth(cursor.getMonth() + monthStep);
    }
    while (cursor <= periodEnd) {
      if (cursor > periodStart && (!end || cursor <= end)) count++;
      cursor.setMonth(cursor.getMonth() + monthStep);
    }
  } else {
    const days = stepDays[event.recurrence];
    const cursor = new Date(start);
    if (cursor < periodStart) {
      const msBetween = periodStart.getTime() - cursor.getTime();
      const daysBetween = msBetween / 86_400_000;
      const steps = Math.floor(daysBetween / days);
      if (steps > 0) cursor.setDate(cursor.getDate() + steps * days);
      while (cursor < periodStart) cursor.setDate(cursor.getDate() + days);
    }
    while (cursor <= periodEnd) {
      if (cursor > periodStart && (!end || cursor <= end)) count++;
      cursor.setDate(cursor.getDate() + days);
    }
  }
  return count;
}
